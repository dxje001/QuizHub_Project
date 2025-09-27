using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KvizHub.Domain.Entities;
using KvizHub.Infrastructure.Data;
using AutoMapper;
using KvizHub.Application.DTOs;

namespace KvizHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public AdminController(UserManager<User> userManager, ApplicationDbContext context, IMapper mapper)
        {
            _userManager = userManager;
            _context = context;
            _mapper = mapper;
        }

        /// <summary>
        /// Get all users with their roles (with pagination and search)
        /// </summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string search = "")
        {
            var query = _userManager.Users.AsQueryable();

            // Apply search filter
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(u =>
                    u.Email.Contains(search) ||
                    u.FirstName.Contains(search) ||
                    u.LastName.Contains(search));
            }

            var totalCount = await query.CountAsync();
            var users = await query
                .OrderBy(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var userList = new List<object>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userList.Add(new
                {
                    id = user.Id,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    emailConfirmed = user.EmailConfirmed,
                    lockoutEnd = user.LockoutEnd,
                    isDisabled = user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTimeOffset.UtcNow,
                    createdAt = user.CreatedAt,
                    roles = roles
                });
            }

            return Ok(new
            {
                message = "Users retrieved successfully",
                data = userList,
                totalCount = totalCount,
                page = page,
                pageSize = pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        /// <summary>
        /// Get user statistics
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetAdminStats()
        {
            var totalUsers = await _userManager.Users.CountAsync();
            var totalQuizzes = await _context.Quizzes.CountAsync();
            var totalQuestions = await _context.Questions.CountAsync();
            var totalCategories = await _context.Categories.CountAsync();
            var totalQuizAttempts = await _context.QuizAttempts.CountAsync();

            return Ok(new
            {
                message = "Admin statistics retrieved successfully",
                data = new
                {
                    totalUsers,
                    totalQuizzes,
                    totalQuestions,
                    totalCategories,
                    totalQuizAttempts
                }
            });
        }

        /// <summary>
        /// Delete a user (except other admins)
        /// </summary>
        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeleteUser(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Contains("Admin"))
            {
                return BadRequest(new { message = "Cannot delete admin users" });
            }

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Failed to delete user", errors = result.Errors });
            }

            return Ok(new { message = "User deleted successfully" });
        }

        /// <summary>
        /// Toggle user account status (enable/disable using lockout)
        /// </summary>
        [HttpPut("users/{userId}/toggle-status")]
        public async Task<IActionResult> ToggleUserStatus(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Contains("Admin"))
            {
                return BadRequest(new { message = "Cannot modify admin users" });
            }

            // Toggle lockout status - if currently locked out, unlock; if not, lock indefinitely
            var isCurrentlyDisabled = user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTimeOffset.UtcNow;

            IdentityResult result;
            if (isCurrentlyDisabled)
            {
                // Enable user by removing lockout
                result = await _userManager.SetLockoutEndDateAsync(user, null);
            }
            else
            {
                // Disable user by setting lockout to far future (effectively permanent)
                result = await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
            }

            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Failed to update user", errors = result.Errors });
            }

            var newStatus = !isCurrentlyDisabled; // Inverted because we just toggled
            return Ok(new {
                message = $"User {(!newStatus ? "disabled" : "enabled")} successfully",
                isActive = !newStatus,
                isDisabled = newStatus
            });
        }

        /// <summary>
        /// Get all quiz attempts (with pagination)
        /// </summary>
        [HttpGet("attempts")]
        public async Task<IActionResult> GetAllAttempts([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 15)
        {
            try
            {
                var query = _context.QuizAttempts
                    .Include(a => a.Quiz)
                        .ThenInclude(q => q.Category)
                    .Include(a => a.Quiz.CreatedBy)
                    .Include(a => a.User)
                    .OrderByDescending(a => a.CreatedAt);

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                var attempts = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var attemptResponses = attempts.Select(a => new QuizAttemptResponse
                {
                    Id = a.Id,
                    QuizId = a.QuizId,
                    Quiz = _mapper.Map<QuizResponse>(a.Quiz),
                    UserId = a.UserId,
                    User = _mapper.Map<UserResponse>(a.User),
                    StartedAt = a.StartedAt,
                    FinishedAt = a.FinishedAt ?? DateTime.UtcNow,
                    Score = a.Score,
                    TotalPoints = a.TotalPoints,
                    Percentage = a.Percentage,
                    Status = a.Status,
                    UserAnswers = new List<UserAnswerResponse>()
                }).ToList();

                var response = new PaginatedResponse<QuizAttemptResponse>
                {
                    Data = attemptResponses,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalPages = totalPages,
                    HasPreviousPage = pageNumber > 1,
                    HasNextPage = pageNumber < totalPages
                };

                return Ok(new { message = "All attempts retrieved successfully", data = response });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Failed to retrieve attempts", error = ex.Message });
            }
        }

        /// <summary>
        /// Get recent quiz attempts
        /// </summary>
        [HttpGet("recent-attempts")]
        public async Task<IActionResult> GetRecentAttempts()
        {
            var recentAttempts = await _context.QuizAttempts
                .Include(qa => qa.User)
                .Include(qa => qa.Quiz)
                .OrderByDescending(qa => qa.StartedAt)
                .Take(20)
                .Select(qa => new
                {
                    id = qa.Id,
                    user = new { qa.User.FirstName, qa.User.LastName, qa.User.Email },
                    quiz = new { qa.Quiz.Title, qa.Quiz.Difficulty },
                    score = qa.Score,
                    totalPoints = qa.TotalPoints,
                    percentage = qa.Percentage,
                    startedAt = qa.StartedAt,
                    finishedAt = qa.FinishedAt,
                    status = qa.Status.ToString()
                })
                .ToListAsync();

            return Ok(new
            {
                message = "Recent attempts retrieved successfully",
                data = recentAttempts
            });
        }

    }
}