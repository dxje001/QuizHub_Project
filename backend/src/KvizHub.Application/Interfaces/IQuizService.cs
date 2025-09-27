using KvizHub.Application.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace KvizHub.Application.Interfaces
{
    public interface IQuizService
    {
        Task<IActionResult> GetQuizzesAsync(QuizFiltersRequest filters);
        Task<IActionResult> GetQuizByIdAsync(Guid quizId);
        Task<IActionResult> CreateQuizAsync(CreateQuizRequest request, string userId);
        Task<IActionResult> UpdateQuizAsync(Guid quizId, UpdateQuizRequest request, string userId, bool isAdmin = false);
        Task<IActionResult> DeleteQuizAsync(Guid quizId, string userId);
        Task<IActionResult> GetMyQuizzesAsync(string userId, QuizFiltersRequest filters);
        Task<IActionResult> GetCategoriesAsync();
        Task<IActionResult> CreateCategoryAsync(CreateCategoryRequest request);
        Task<IActionResult> GetQuizForTakingAsync(Guid quizId);
        Task<IActionResult> SubmitQuizAttemptAsync(Guid quizId, SubmitQuizAttemptRequest request, string userId);
        Task<IActionResult> GetUserAttemptsAsync(string userId, int pageNumber, int pageSize);
        Task<IActionResult> GetAttemptDetailsAsync(Guid attemptId, string userId);
        Task<IActionResult> GetLeaderboardAsync(LeaderboardRequest request);
    }
}