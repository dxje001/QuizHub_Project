using KvizHub.Application.DTOs;
using KvizHub.Application.Interfaces;
using KvizHub.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace KvizHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class QuizController : ControllerBase
    {
        private readonly IQuizService _quizService;
        private readonly UserManager<User> _userManager;

        public QuizController(IQuizService quizService, UserManager<User> userManager)
        {
            _quizService = quizService;
            _userManager = userManager;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetQuizzes([FromQuery] QuizFiltersRequest filters)
        {
            return await _quizService.GetQuizzesAsync(filters);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetQuiz(Guid id)
        {
            return await _quizService.GetQuizByIdAsync(id);
        }

        [HttpPost]
        public async Task<IActionResult> CreateQuiz([FromBody] CreateQuizRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not found" });
            }

            return await _quizService.CreateQuizAsync(request, userId);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuiz(Guid id, [FromBody] UpdateQuizRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not found" });
            }

            // Check if user is admin
            var user = await _userManager.FindByIdAsync(userId);
            var isAdmin = user != null && await _userManager.IsInRoleAsync(user, "Admin");

            return await _quizService.UpdateQuizAsync(id, request, userId, isAdmin);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuiz(Guid id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not found" });
            }

            return await _quizService.DeleteQuizAsync(id, userId);
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyQuizzes([FromQuery] QuizFiltersRequest filters)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not found" });
            }

            return await _quizService.GetMyQuizzesAsync(userId, filters);
        }

        [HttpGet("{id}/take")]
        [AllowAnonymous]
        public async Task<IActionResult> GetQuizForTaking(Guid id)
        {
            return await _quizService.GetQuizForTakingAsync(id);
        }

        [HttpPost("{id}/submit")]
        public async Task<IActionResult> SubmitQuizAttempt(Guid id, [FromBody] SubmitQuizAttemptRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not found" });
            }

            return await _quizService.SubmitQuizAttemptAsync(id, request, userId);
        }

        [HttpGet("attempts")]
        public async Task<IActionResult> GetMyAttempts([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not found" });
            }

            return await _quizService.GetUserAttemptsAsync(userId, pageNumber, pageSize);
        }

        [HttpGet("attempts/{attemptId}")]
        public async Task<IActionResult> GetAttemptDetails(Guid attemptId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not found" });
            }

            return await _quizService.GetAttemptDetailsAsync(attemptId, userId);
        }

        [HttpGet("leaderboard")]
        [AllowAnonymous]
        public async Task<IActionResult> GetLeaderboard([FromQuery] LeaderboardRequest request)
        {
            return await _quizService.GetLeaderboardAsync(request);
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CategoryController : ControllerBase
    {
        private readonly IQuizService _quizService;

        public CategoryController(IQuizService quizService)
        {
            _quizService = quizService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategories()
        {
            return await _quizService.GetCategoriesAsync();
        }

        [HttpPost]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
        {
            return await _quizService.CreateCategoryAsync(request);
        }
    }
}