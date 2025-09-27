using KvizHub.Domain.Enums;

namespace KvizHub.Application.DTOs
{
    public class CreateQuizRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Guid CategoryId { get; set; }
        public QuizDifficulty Difficulty { get; set; } = QuizDifficulty.Easy;
        public int? TimeLimit { get; set; } // in minutes
        public bool IsPublic { get; set; } = true;
        public List<CreateQuestionRequest> Questions { get; set; } = new();
    }

    public class UpdateQuizRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Guid CategoryId { get; set; }
        public QuizDifficulty Difficulty { get; set; }
        public int? TimeLimit { get; set; }
        public bool IsPublic { get; set; }
        public List<UpdateQuestionRequest> Questions { get; set; } = new();
    }

    public class QuizResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Guid CategoryId { get; set; }
        public CategoryResponse Category { get; set; } = null!;
        public QuizDifficulty Difficulty { get; set; }
        public int? TimeLimit { get; set; }
        public int QuestionsCount { get; set; }
        public bool IsPublic { get; set; }
        public string CreatedById { get; set; } = string.Empty;
        public UserResponse CreatedBy { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<QuestionResponse>? Questions { get; set; }
    }

    public class QuizListResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public CategoryResponse Category { get; set; } = null!;
        public QuizDifficulty Difficulty { get; set; }
        public int? TimeLimit { get; set; }
        public int QuestionsCount { get; set; }
        public bool IsPublic { get; set; }
        public UserResponse CreatedBy { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }

    public class CreateQuestionRequest
    {
        public QuestionType Type { get; set; } = QuestionType.MultipleChoice;
        public string QuestionText { get; set; } = string.Empty;
        public int Points { get; set; } = 1;
        public int? TimeLimit { get; set; } // in seconds
        public int Order { get; set; } = 0;
        public List<CreateAnswerRequest> Answers { get; set; } = new();
    }

    public class UpdateQuestionRequest
    {
        public Guid? Id { get; set; } // null for new questions
        public QuestionType Type { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public int Points { get; set; }
        public int? TimeLimit { get; set; }
        public int Order { get; set; }
        public List<UpdateAnswerRequest> Answers { get; set; } = new();
    }

    public class QuestionResponse
    {
        public Guid Id { get; set; }
        public Guid QuizId { get; set; }
        public QuestionType Type { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public int Points { get; set; }
        public int? TimeLimit { get; set; }
        public int Order { get; set; }
        public List<AnswerResponse> Answers { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateAnswerRequest
    {
        public string AnswerText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; } = false;
        public int Order { get; set; } = 0;
    }

    public class UpdateAnswerRequest
    {
        public Guid? Id { get; set; } // null for new answers
        public string AnswerText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public int Order { get; set; }
    }

    public class AnswerResponse
    {
        public Guid Id { get; set; }
        public Guid QuestionId { get; set; }
        public string AnswerText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public int Order { get; set; }
    }

    public class CategoryResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Icon { get; set; }
    }

    public class CreateCategoryRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Icon { get; set; }
    }

    public class UserResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string FullName { get; set; } = string.Empty;
    }

    public class QuizFiltersRequest
    {
        public string? Search { get; set; }
        public Guid? CategoryId { get; set; }
        public QuizDifficulty? Difficulty { get; set; }
        public bool? IsPublic { get; set; }
        public string? CreatedById { get; set; }
        public string SortBy { get; set; } = "CreatedAt";
        public string SortOrder { get; set; } = "desc";
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class PaginatedResponse<T>
    {
        public List<T> Data { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasPreviousPage { get; set; }
        public bool HasNextPage { get; set; }
    }

    public class SubmitQuizAttemptRequest
    {
        public List<UserAnswerRequest> Answers { get; set; } = new();
        public DateTime StartedAt { get; set; }
        public DateTime FinishedAt { get; set; }
    }

    public class UserAnswerRequest
    {
        public Guid QuestionId { get; set; }
        public List<Guid> SelectedAnswerIds { get; set; } = new();
        public int TimeSpent { get; set; } // in milliseconds
    }

    public class QuizAttemptResponse
    {
        public Guid Id { get; set; }
        public Guid QuizId { get; set; }
        public QuizResponse Quiz { get; set; } = null!;
        public string UserId { get; set; } = string.Empty;
        public UserResponse User { get; set; } = null!;
        public DateTime StartedAt { get; set; }
        public DateTime FinishedAt { get; set; }
        public int Score { get; set; }
        public int TotalPoints { get; set; }
        public decimal Percentage { get; set; }
        public AttemptStatus Status { get; set; }
        public List<UserAnswerResponse> UserAnswers { get; set; } = new();
    }

    public class UserAnswerResponse
    {
        public Guid Id { get; set; }
        public Guid AttemptId { get; set; }
        public Guid QuestionId { get; set; }
        public QuestionResponse Question { get; set; } = null!;
        public List<Guid> SelectedAnswerIds { get; set; } = new();
        public bool IsCorrect { get; set; }
        public int PointsEarned { get; set; }
        public int TimeSpent { get; set; }
        public DateTime AnsweredAt { get; set; }
    }

    public class QuizForTakingResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public CategoryResponse Category { get; set; } = null!;
        public QuizDifficulty Difficulty { get; set; }
        public int? TimeLimit { get; set; }
        public int QuestionsCount { get; set; }
        public UserResponse CreatedBy { get; set; } = null!;
        public List<QuestionForTakingResponse> Questions { get; set; } = new();
    }

    public class QuestionForTakingResponse
    {
        public Guid Id { get; set; }
        public QuestionType Type { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public int Points { get; set; }
        public int? TimeLimit { get; set; }
        public int Order { get; set; }
        public List<AnswerForTakingResponse> Answers { get; set; } = new();
    }

    public class AnswerForTakingResponse
    {
        public Guid Id { get; set; }
        public string AnswerText { get; set; } = string.Empty;
        public int Order { get; set; }
    }

    public class LeaderboardRequest
    {
        public Guid? QuizId { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public LeaderboardTimeframe Timeframe { get; set; } = LeaderboardTimeframe.AllTime;
    }

    public class LeaderboardResponse
    {
        public Guid? QuizId { get; set; }
        public QuizResponse? Quiz { get; set; }
        public List<LeaderboardEntryResponse> Entries { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasPreviousPage { get; set; }
        public bool HasNextPage { get; set; }
        public LeaderboardTimeframe Timeframe { get; set; }
    }

    public class LeaderboardEntryResponse
    {
        public string UserId { get; set; } = string.Empty;
        public UserResponse User { get; set; } = null!;
        public int Score { get; set; }
        public int TotalPoints { get; set; }
        public decimal Percentage { get; set; }
        public DateTime CompletedAt { get; set; }
        public int Rank { get; set; }
        public TimeSpan Duration { get; set; }
        public Guid AttemptId { get; set; }
    }
}