using AutoMapper;
using KvizHub.Application.DTOs;
using KvizHub.Application.Interfaces;
using KvizHub.Domain.Entities;
using KvizHub.Domain.Enums;
using KvizHub.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace KvizHub.Infrastructure.Services
{
    public class QuizService : IQuizService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public QuizService(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IActionResult> GetQuizzesAsync(QuizFiltersRequest filters)
        {
            try
            {
                var query = _context.Quizzes
                    .Include(q => q.Category)
                    .Include(q => q.CreatedBy)
                    .Include(q => q.Questions)
                    .Where(q => q.IsPublic)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(filters.Search))
                {
                    query = query.Where(q => q.Title.Contains(filters.Search) ||
                                           q.Description.Contains(filters.Search));
                }

                if (filters.CategoryId.HasValue)
                {
                    query = query.Where(q => q.CategoryId == filters.CategoryId.Value);
                }

                if (filters.Difficulty.HasValue)
                {
                    query = query.Where(q => q.Difficulty == filters.Difficulty.Value);
                }

                // Apply sorting
                query = filters.SortBy.ToLower() switch
                {
                    "title" => filters.SortOrder.ToLower() == "desc"
                        ? query.OrderByDescending(q => q.Title)
                        : query.OrderBy(q => q.Title),
                    "difficulty" => filters.SortOrder.ToLower() == "desc"
                        ? query.OrderByDescending(q => q.Difficulty)
                        : query.OrderBy(q => q.Difficulty),
                    "questionscount" => filters.SortOrder.ToLower() == "desc"
                        ? query.OrderByDescending(q => q.Questions.Count)
                        : query.OrderBy(q => q.Questions.Count),
                    "category" => filters.SortOrder.ToLower() == "desc"
                        ? query.OrderByDescending(q => q.Category.Name)
                        : query.OrderBy(q => q.Category.Name),
                    _ => filters.SortOrder.ToLower() == "desc"
                        ? query.OrderByDescending(q => q.CreatedAt)
                        : query.OrderBy(q => q.CreatedAt)
                };

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)filters.PageSize);

                var quizzes = await query
                    .Skip((filters.PageNumber - 1) * filters.PageSize)
                    .Take(filters.PageSize)
                    .ToListAsync();

                var quizListResponses = _mapper.Map<List<QuizListResponse>>(quizzes);

                var response = new PaginatedResponse<QuizListResponse>
                {
                    Data = quizListResponses,
                    TotalCount = totalCount,
                    PageNumber = filters.PageNumber,
                    PageSize = filters.PageSize,
                    TotalPages = totalPages,
                    HasPreviousPage = filters.PageNumber > 1,
                    HasNextPage = filters.PageNumber < totalPages
                };

                return new OkObjectResult(new { message = "Quizzes retrieved successfully", data = response });
            }
            catch (Exception ex)
            {
                return new BadRequestObjectResult(new { message = "Failed to retrieve quizzes", error = ex.Message });
            }
        }

        public async Task<IActionResult> GetQuizByIdAsync(Guid quizId)
        {
            try
            {
                var quiz = await _context.Quizzes
                    .Include(q => q.Category)
                    .Include(q => q.CreatedBy)
                    .Include(q => q.Questions)
                        .ThenInclude(qu => qu.Answers)
                    .FirstOrDefaultAsync(q => q.Id == quizId);

                if (quiz == null)
                {
                    return new NotFoundObjectResult(new { message = "Quiz not found" });
                }

                var quizResponse = _mapper.Map<QuizResponse>(quiz);
                return new OkObjectResult(new { message = "Quiz retrieved successfully", data = quizResponse });
            }
            catch (Exception ex)
            {
                return new BadRequestObjectResult(new { message = "Failed to retrieve quiz", error = ex.Message });
            }
        }

        public async Task<IActionResult> CreateQuizAsync(CreateQuizRequest request, string userId)
        {
            try
            {
                var quiz = _mapper.Map<Quiz>(request);
                quiz.CreatedById = userId;
                quiz.CreatedAt = DateTime.UtcNow;
                quiz.UpdatedAt = DateTime.UtcNow;

                // Create questions and answers
                foreach (var questionRequest in request.Questions)
                {
                    var question = _mapper.Map<Question>(questionRequest);
                    question.Id = Guid.NewGuid();
                    question.CreatedAt = DateTime.UtcNow;
                    question.UpdatedAt = DateTime.UtcNow;

                    foreach (var answerRequest in questionRequest.Answers)
                    {
                        var answer = _mapper.Map<Answer>(answerRequest);
                        answer.Id = Guid.NewGuid();
                        answer.QuestionId = question.Id;
                        question.Answers.Add(answer);
                    }

                    quiz.Questions.Add(question);
                }

                _context.Quizzes.Add(quiz);
                await _context.SaveChangesAsync();

                var createdQuiz = await _context.Quizzes
                    .Include(q => q.Category)
                    .Include(q => q.CreatedBy)
                    .Include(q => q.Questions)
                        .ThenInclude(qu => qu.Answers)
                    .FirstOrDefaultAsync(q => q.Id == quiz.Id);

                var quizResponse = _mapper.Map<QuizResponse>(createdQuiz);
                return new OkObjectResult(new { message = "Quiz created successfully", data = quizResponse });
            }
            catch (Exception ex)
            {
                return new BadRequestObjectResult(new { message = "Failed to create quiz", error = ex.Message });
            }
        }

        public async Task<IActionResult> UpdateQuizAsync(Guid quizId, UpdateQuizRequest request, string userId, bool isAdmin = false)
        {
            try
            {
                var quiz = await _context.Quizzes
                    .FirstOrDefaultAsync(q => q.Id == quizId);

                if (quiz == null)
                {
                    return new NotFoundObjectResult(new { message = "Quiz not found" });
                }

                // Allow admins to update any quiz, regular users can only update their own quizzes
                if (!isAdmin && quiz.CreatedById != userId)
                {
                    return new ObjectResult(new { message = "You don't have permission to update this quiz" })
                    {
                        StatusCode = 403
                    };
                }

                // Update quiz basic properties
                quiz.Title = request.Title;
                quiz.Description = request.Description;
                quiz.CategoryId = request.CategoryId;
                quiz.Difficulty = request.Difficulty;
                quiz.TimeLimit = request.TimeLimit;
                quiz.IsPublic = request.IsPublic;
                quiz.UpdatedAt = DateTime.UtcNow;

                // Handle questions update
                if (request.Questions != null && request.Questions.Any())
                {
                    // Load existing questions with answers
                    var existingQuestions = await _context.Questions
                        .Include(q => q.Answers)
                        .Where(q => q.QuizId == quizId)
                        .ToListAsync();

                    // Get question IDs from the request
                    var requestQuestionIds = request.Questions
                        .Where(q => q.Id.HasValue)
                        .Select(q => q.Id!.Value)
                        .ToList();

                    // Delete questions that are not in the request
                    var questionsToDelete = existingQuestions
                        .Where(q => !requestQuestionIds.Contains(q.Id))
                        .ToList();

                    foreach (var questionToDelete in questionsToDelete)
                    {
                        _context.Answers.RemoveRange(questionToDelete.Answers);
                        _context.Questions.Remove(questionToDelete);
                    }

                    // Process each question in the request
                    foreach (var requestQuestion in request.Questions)
                    {
                        if (requestQuestion.Id.HasValue)
                        {
                            // Update existing question
                            var existingQuestion = existingQuestions.FirstOrDefault(q => q.Id == requestQuestion.Id.Value);
                            if (existingQuestion != null)
                            {
                                existingQuestion.Type = requestQuestion.Type;
                                existingQuestion.QuestionText = requestQuestion.QuestionText;
                                existingQuestion.Points = requestQuestion.Points;
                                existingQuestion.TimeLimit = requestQuestion.TimeLimit;
                                existingQuestion.Order = requestQuestion.Order;
                                existingQuestion.UpdatedAt = DateTime.UtcNow;

                                // Handle answers update for existing question
                                await UpdateAnswersForQuestion(existingQuestion, requestQuestion.Answers);
                            }
                        }
                        else
                        {
                            // Create new question
                            var newQuestion = new Domain.Entities.Question
                            {
                                Id = Guid.NewGuid(),
                                QuizId = quizId,
                                Type = requestQuestion.Type,
                                QuestionText = requestQuestion.QuestionText,
                                Points = requestQuestion.Points,
                                TimeLimit = requestQuestion.TimeLimit,
                                Order = requestQuestion.Order,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow,
                                Answers = requestQuestion.Answers.Select((a, index) => new Domain.Entities.Answer
                                {
                                    Id = Guid.NewGuid(),
                                    AnswerText = a.AnswerText,
                                    IsCorrect = a.IsCorrect,
                                    Order = a.Order,
                                    CreatedAt = DateTime.UtcNow,
                                    UpdatedAt = DateTime.UtcNow
                                }).ToList()
                            };

                            _context.Questions.Add(newQuestion);
                        }
                    }
                }

                await _context.SaveChangesAsync();

                var updatedQuiz = await _context.Quizzes
                    .Include(q => q.Category)
                    .Include(q => q.CreatedBy)
                    .Include(q => q.Questions)
                        .ThenInclude(q => q.Answers)
                    .FirstOrDefaultAsync(q => q.Id == quizId);

                var quizResponse = _mapper.Map<QuizResponse>(updatedQuiz);
                return new OkObjectResult(new { message = "Quiz updated successfully", data = quizResponse });
            }
            catch (Exception ex)
            {
                return new BadRequestObjectResult(new { message = "Failed to update quiz", error = ex.Message });
            }
        }

        private async Task UpdateAnswersForQuestion(Domain.Entities.Question existingQuestion, List<UpdateAnswerRequest> requestAnswers)
        {
            // Get answer IDs from the request
            var requestAnswerIds = requestAnswers
                .Where(a => a.Id.HasValue)
                .Select(a => a.Id!.Value)
                .ToList();

            // Delete answers that are not in the request
            var answersToDelete = existingQuestion.Answers
                .Where(a => !requestAnswerIds.Contains(a.Id))
                .ToList();

            foreach (var answerToDelete in answersToDelete)
            {
                _context.Answers.Remove(answerToDelete);
            }

            // Process each answer in the request
            foreach (var requestAnswer in requestAnswers)
            {
                if (requestAnswer.Id.HasValue)
                {
                    // Update existing answer
                    var existingAnswer = existingQuestion.Answers.FirstOrDefault(a => a.Id == requestAnswer.Id.Value);
                    if (existingAnswer != null)
                    {
                        existingAnswer.AnswerText = requestAnswer.AnswerText;
                        existingAnswer.IsCorrect = requestAnswer.IsCorrect;
                        existingAnswer.Order = requestAnswer.Order;
                        existingAnswer.UpdatedAt = DateTime.UtcNow;
                    }
                }
                else
                {
                    // Create new answer
                    var newAnswer = new Domain.Entities.Answer
                    {
                        Id = Guid.NewGuid(),
                        QuestionId = existingQuestion.Id,
                        AnswerText = requestAnswer.AnswerText,
                        IsCorrect = requestAnswer.IsCorrect,
                        Order = requestAnswer.Order,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Answers.Add(newAnswer);
                }
            }
        }

        public async Task<IActionResult> DeleteQuizAsync(Guid quizId, string userId)
        {
            try
            {
                var quiz = await _context.Quizzes
                    .FirstOrDefaultAsync(q => q.Id == quizId);

                if (quiz == null)
                {
                    return new NotFoundObjectResult(new { message = "Quiz not found" });
                }

                if (quiz.CreatedById != userId)
                {
                    return new ObjectResult(new { message = "You don't have permission to delete this quiz" })
                    {
                        StatusCode = 403
                    };
                }

                _context.Quizzes.Remove(quiz);
                await _context.SaveChangesAsync();

                return new OkObjectResult(new { message = "Quiz deleted successfully" });
            }
            catch (Exception ex)
            {
                return new BadRequestObjectResult(new { message = "Failed to delete quiz", error = ex.Message });
            }
        }

        public async Task<IActionResult> GetMyQuizzesAsync(string userId, QuizFiltersRequest filters)
        {
            try
            {
                var query = _context.Quizzes
                    .Include(q => q.Category)
                    .Include(q => q.CreatedBy)
                    .Include(q => q.Questions)
                    .Where(q => q.CreatedById == userId)
                    .AsQueryable();

                // Apply filters (same as GetQuizzesAsync but without IsPublic filter)
                if (!string.IsNullOrEmpty(filters.Search))
                {
                    query = query.Where(q => q.Title.Contains(filters.Search) ||
                                           q.Description.Contains(filters.Search));
                }

                if (filters.CategoryId.HasValue)
                {
                    query = query.Where(q => q.CategoryId == filters.CategoryId.Value);
                }

                if (filters.Difficulty.HasValue)
                {
                    query = query.Where(q => q.Difficulty == filters.Difficulty.Value);
                }

                // Apply sorting
                query = filters.SortBy.ToLower() switch
                {
                    "title" => filters.SortOrder.ToLower() == "desc"
                        ? query.OrderByDescending(q => q.Title)
                        : query.OrderBy(q => q.Title),
                    "difficulty" => filters.SortOrder.ToLower() == "desc"
                        ? query.OrderByDescending(q => q.Difficulty)
                        : query.OrderBy(q => q.Difficulty),
                    "questionscount" => filters.SortOrder.ToLower() == "desc"
                        ? query.OrderByDescending(q => q.Questions.Count)
                        : query.OrderBy(q => q.Questions.Count),
                    "category" => filters.SortOrder.ToLower() == "desc"
                        ? query.OrderByDescending(q => q.Category.Name)
                        : query.OrderBy(q => q.Category.Name),
                    _ => filters.SortOrder.ToLower() == "desc"
                        ? query.OrderByDescending(q => q.CreatedAt)
                        : query.OrderBy(q => q.CreatedAt)
                };

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)filters.PageSize);

                var quizzes = await query
                    .Skip((filters.PageNumber - 1) * filters.PageSize)
                    .Take(filters.PageSize)
                    .ToListAsync();

                var quizListResponses = _mapper.Map<List<QuizListResponse>>(quizzes);

                var response = new PaginatedResponse<QuizListResponse>
                {
                    Data = quizListResponses,
                    TotalCount = totalCount,
                    PageNumber = filters.PageNumber,
                    PageSize = filters.PageSize,
                    TotalPages = totalPages,
                    HasPreviousPage = filters.PageNumber > 1,
                    HasNextPage = filters.PageNumber < totalPages
                };

                return new OkObjectResult(new { message = "My quizzes retrieved successfully", data = response });
            }
            catch (Exception ex)
            {
                return new BadRequestObjectResult(new { message = "Failed to retrieve my quizzes", error = ex.Message });
            }
        }

        public async Task<IActionResult> GetCategoriesAsync()
        {
            try
            {
                var categories = await _context.Categories.ToListAsync();
                var categoryResponses = _mapper.Map<List<CategoryResponse>>(categories);
                return new OkObjectResult(new { message = "Categories retrieved successfully", data = categoryResponses });
            }
            catch (Exception ex)
            {
                return new BadRequestObjectResult(new { message = "Failed to retrieve categories", error = ex.Message });
            }
        }

        public async Task<IActionResult> CreateCategoryAsync(CreateCategoryRequest request)
        {
            try
            {
                var category = _mapper.Map<Category>(request);
                category.Id = Guid.NewGuid();
                category.CreatedAt = DateTime.UtcNow;
                category.UpdatedAt = DateTime.UtcNow;

                _context.Categories.Add(category);
                await _context.SaveChangesAsync();

                var categoryResponse = _mapper.Map<CategoryResponse>(category);
                return new OkObjectResult(new { message = "Category created successfully", data = categoryResponse });
            }
            catch (Exception ex)
            {
                return new BadRequestObjectResult(new { message = "Failed to create category", error = ex.Message });
            }
        }

        public async Task<IActionResult> GetQuizForTakingAsync(Guid quizId)
        {
            try
            {
                var quiz = await _context.Quizzes
                    .Include(q => q.Category)
                    .Include(q => q.CreatedBy)
                    .Include(q => q.Questions.OrderBy(qu => qu.Order))
                        .ThenInclude(qu => qu.Answers.OrderBy(a => a.Order))
                    .FirstOrDefaultAsync(q => q.Id == quizId && q.IsPublic);

                if (quiz == null)
                {
                    return new NotFoundObjectResult(new { message = "Quiz not found or not public" });
                }

                // Create a specialized response for quiz taking without correct answer flags
                var quizForTaking = new QuizForTakingResponse
                {
                    Id = quiz.Id,
                    Title = quiz.Title,
                    Description = quiz.Description,
                    Category = _mapper.Map<CategoryResponse>(quiz.Category),
                    Difficulty = quiz.Difficulty,
                    TimeLimit = quiz.TimeLimit,
                    QuestionsCount = quiz.Questions.Count,
                    CreatedBy = _mapper.Map<UserResponse>(quiz.CreatedBy),
                    Questions = quiz.Questions.Select(q => new QuestionForTakingResponse
                    {
                        Id = q.Id,
                        Type = q.Type,
                        QuestionText = q.QuestionText,
                        Points = q.Points,
                        TimeLimit = q.TimeLimit,
                        Order = q.Order,
                        Answers = q.Answers.Select(a => new AnswerForTakingResponse
                        {
                            Id = a.Id,
                            AnswerText = a.AnswerText,
                            Order = a.Order
                        }).ToList()
                    }).ToList()
                };

                return new OkObjectResult(new { message = "Quiz retrieved for taking", data = quizForTaking });
            }
            catch (Exception ex)
            {
                return new BadRequestObjectResult(new { message = "Failed to retrieve quiz for taking", error = ex.Message });
            }
        }

        public async Task<IActionResult> SubmitQuizAttemptAsync(Guid quizId, SubmitQuizAttemptRequest request, string userId)
        {
            try
            {
                // Validate quiz exists and is public
                var quiz = await _context.Quizzes
                    .Include(q => q.Questions)
                        .ThenInclude(qu => qu.Answers)
                    .FirstOrDefaultAsync(q => q.Id == quizId && q.IsPublic);

                if (quiz == null)
                {
                    return new NotFoundObjectResult(new { message = "Quiz not found or not public" });
                }

                // Create quiz attempt
                var attempt = new QuizAttempt
                {
                    Id = Guid.NewGuid(),
                    QuizId = quizId,
                    UserId = userId,
                    StartedAt = request.StartedAt,
                    FinishedAt = request.FinishedAt,
                    Status = AttemptStatus.Completed,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Calculate scores and create user answers
                int totalScore = 0;
                int totalPoints = quiz.Questions.Sum(q => q.Points);

                foreach (var answerRequest in request.Answers)
                {
                    var question = quiz.Questions.FirstOrDefault(q => q.Id == answerRequest.QuestionId);
                    if (question == null) continue;

                    var correctAnswerIds = question.Answers.Where(a => a.IsCorrect).Select(a => a.Id).ToList();
                    var userAnswerIds = answerRequest.SelectedAnswerIds;

                    // Check if answer is correct based on question type
                    bool isCorrect = false;
                    switch (question.Type)
                    {
                        case QuestionType.MultipleChoice:
                        case QuestionType.TrueFalse:
                            // For single choice, user must select exactly one correct answer
                            isCorrect = userAnswerIds.Count == 1 &&
                                       correctAnswerIds.Count == 1 &&
                                       userAnswerIds.First() == correctAnswerIds.First();
                            break;
                        case QuestionType.MultipleSelect:
                            // For multiple select, user must select all correct answers and no incorrect ones
                            isCorrect = userAnswerIds.Count == correctAnswerIds.Count &&
                                       userAnswerIds.All(id => correctAnswerIds.Contains(id));
                            break;
                        case QuestionType.ShortAnswer:
                            // For short answer, check if any correct answer matches (case-insensitive)
                            var correctTexts = question.Answers.Where(a => a.IsCorrect).Select(a => a.AnswerText.ToLower());
                            var userTexts = question.Answers.Where(a => userAnswerIds.Contains(a.Id)).Select(a => a.AnswerText.ToLower());
                            isCorrect = userTexts.Any(ut => correctTexts.Contains(ut));
                            break;
                    }

                    int pointsEarned = isCorrect ? question.Points : 0;
                    totalScore += pointsEarned;

                    var userAnswer = new UserAnswer
                    {
                        Id = Guid.NewGuid(),
                        AttemptId = attempt.Id,
                        QuestionId = answerRequest.QuestionId,
                        IsCorrect = isCorrect,
                        PointsEarned = pointsEarned,
                        TimeSpent = answerRequest.TimeSpent / 1000, // Convert milliseconds to seconds
                        AnsweredAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    userAnswer.SetSelectedAnswerIds(answerRequest.SelectedAnswerIds);

                    attempt.UserAnswers.Add(userAnswer);
                }

                attempt.Score = totalScore;
                attempt.TotalPoints = totalPoints;

                _context.QuizAttempts.Add(attempt);
                await _context.SaveChangesAsync();

                // Return attempt details
                var submittedAttempt = await _context.QuizAttempts
                    .Include(a => a.Quiz)
                        .ThenInclude(q => q.Category)
                    .Include(a => a.Quiz.CreatedBy)
                    .Include(a => a.User)
                    .Include(a => a.UserAnswers)
                        .ThenInclude(ua => ua.Question)
                            .ThenInclude(q => q.Answers)
                    .FirstOrDefaultAsync(a => a.Id == attempt.Id);

                var attemptResponse = _mapper.Map<QuizAttemptResponse>(submittedAttempt);
                return new OkObjectResult(new { message = "Quiz attempt submitted successfully", data = attemptResponse });
            }
            catch (Exception ex)
            {
                return new BadRequestObjectResult(new { message = "Failed to submit quiz attempt", error = ex.Message });
            }
        }

        public async Task<IActionResult> GetUserAttemptsAsync(string userId, int pageNumber, int pageSize)
        {
            try
            {
                var query = _context.QuizAttempts
                    .Include(a => a.Quiz)
                        .ThenInclude(q => q.Category)
                    .Include(a => a.Quiz.CreatedBy)
                    .Where(a => a.UserId == userId)
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
                    UserAnswers = new List<UserAnswerResponse>() // Don't include detailed answers in list view
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

                return new OkObjectResult(new { message = "User attempts retrieved successfully", data = response });
            }
            catch (Exception ex)
            {
                return new BadRequestObjectResult(new { message = "Failed to retrieve user attempts", error = ex.Message });
            }
        }

        public async Task<IActionResult> GetAttemptDetailsAsync(Guid attemptId, string userId)
        {
            try
            {
                var attempt = await _context.QuizAttempts
                    .Include(a => a.Quiz)
                        .ThenInclude(q => q.Category)
                    .Include(a => a.Quiz.CreatedBy)
                    .Include(a => a.User)
                    .Include(a => a.UserAnswers)
                        .ThenInclude(ua => ua.Question)
                            .ThenInclude(q => q.Answers)
                    .FirstOrDefaultAsync(a => a.Id == attemptId && a.UserId == userId);

                if (attempt == null)
                {
                    return new NotFoundObjectResult(new { message = "Attempt not found or you don't have permission to view it" });
                }

                var attemptResponse = _mapper.Map<QuizAttemptResponse>(attempt);
                return new OkObjectResult(new { message = "Attempt details retrieved successfully", data = attemptResponse });
            }
            catch (Exception ex)
            {
                return new BadRequestObjectResult(new { message = "Failed to retrieve attempt details", error = ex.Message });
            }
        }

        public async Task<IActionResult> GetLeaderboardAsync(LeaderboardRequest request)
        {
            try
            {
                var query = _context.QuizAttempts
                    .Include(a => a.Quiz)
                        .ThenInclude(q => q.Category)
                    .Include(a => a.User)
                    .Where(a => a.Status == AttemptStatus.Completed)
                    .AsQueryable();

                // Filter by specific quiz if provided
                if (request.QuizId.HasValue)
                {
                    query = query.Where(a => a.QuizId == request.QuizId.Value);
                }

                // Apply timeframe filtering
                var cutoffDate = GetTimeframeCutoffDate(request.Timeframe);
                if (cutoffDate.HasValue)
                {
                    query = query.Where(a => a.FinishedAt >= cutoffDate.Value);
                }

                // Group by user and get their best attempt for each quiz
                var bestAttempts = await query
                    .GroupBy(a => new { a.UserId, a.QuizId })
                    .Select(g => g.OrderByDescending(a => a.Score)
                                  .ThenBy(a => a.FinishedAt - a.StartedAt) // Prefer faster completion times
                                  .First())
                    .ToListAsync();

                // Calculate aggregate scores per user
                var leaderboardData = bestAttempts
                    .GroupBy(a => a.UserId)
                    .Select(g => new
                    {
                        UserId = g.Key,
                        User = g.First().User,
                        TotalScore = g.Sum(a => a.Score),
                        TotalPossiblePoints = g.Sum(a => a.TotalPoints),
                        AveragePercentage = g.Average(a => (decimal)a.Score / a.TotalPoints * 100),
                        BestAttempt = g.OrderByDescending(a => (decimal)a.Score / a.TotalPoints).First(),
                        TotalDuration = g.Aggregate(TimeSpan.Zero, (acc, a) => acc.Add((a.FinishedAt ?? DateTime.UtcNow) - a.StartedAt))
                    })
                    .OrderByDescending(x => x.AveragePercentage)
                    .ThenByDescending(x => x.TotalScore)
                    .ThenBy(x => x.TotalDuration)
                    .ToList();

                var totalCount = leaderboardData.Count;
                var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

                var pagedData = leaderboardData
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToList();

                var entries = pagedData.Select((entry, index) => new LeaderboardEntryResponse
                {
                    UserId = entry.UserId,
                    User = _mapper.Map<UserResponse>(entry.User),
                    Score = entry.TotalScore,
                    TotalPoints = entry.TotalPossiblePoints,
                    Percentage = Math.Round(entry.AveragePercentage, 2),
                    CompletedAt = entry.BestAttempt.FinishedAt ?? DateTime.UtcNow,
                    Rank = (request.PageNumber - 1) * request.PageSize + index + 1,
                    Duration = entry.TotalDuration,
                    AttemptId = entry.BestAttempt.Id
                }).ToList();

                Quiz? quiz = null;
                if (request.QuizId.HasValue)
                {
                    quiz = await _context.Quizzes
                        .Include(q => q.Category)
                        .Include(q => q.CreatedBy)
                        .FirstOrDefaultAsync(q => q.Id == request.QuizId.Value);
                }

                var response = new LeaderboardResponse
                {
                    QuizId = request.QuizId,
                    Quiz = quiz != null ? _mapper.Map<QuizResponse>(quiz) : null,
                    Entries = entries,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize,
                    TotalPages = totalPages,
                    HasPreviousPage = request.PageNumber > 1,
                    HasNextPage = request.PageNumber < totalPages,
                    Timeframe = request.Timeframe
                };

                return new OkObjectResult(new { message = "Leaderboard retrieved successfully", data = response });
            }
            catch (Exception ex)
            {
                return new BadRequestObjectResult(new { message = "Failed to retrieve leaderboard", error = ex.Message });
            }
        }

        private DateTime? GetTimeframeCutoffDate(LeaderboardTimeframe timeframe)
        {
            var now = DateTime.UtcNow;
            return timeframe switch
            {
                LeaderboardTimeframe.Today => now.Date,
                LeaderboardTimeframe.ThisWeek => now.Date.AddDays(-(int)now.DayOfWeek),
                LeaderboardTimeframe.ThisMonth => new DateTime(now.Year, now.Month, 1),
                LeaderboardTimeframe.ThisYear => new DateTime(now.Year, 1, 1),
                LeaderboardTimeframe.AllTime => null,
                _ => null
            };
        }
    }
}