using KvizHub.Domain.Enums;

namespace KvizHub.Domain.Entities
{
    public class QuizAttempt : BaseEntity
    {
        public Guid QuizId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? FinishedAt { get; set; }
        public int Score { get; set; } = 0;
        public int TotalPoints { get; set; } = 0;
        public AttemptStatus Status { get; set; } = AttemptStatus.InProgress;

        // Navigation properties
        public virtual Quiz Quiz { get; set; } = null!;
        public virtual User User { get; set; } = null!;
        public virtual ICollection<UserAnswer> UserAnswers { get; set; } = new List<UserAnswer>();

        public decimal Percentage => TotalPoints > 0 ? (decimal)Score / TotalPoints * 100 : 0;
        public TimeSpan? Duration => FinishedAt.HasValue ? FinishedAt.Value - StartedAt : null;
    }
}