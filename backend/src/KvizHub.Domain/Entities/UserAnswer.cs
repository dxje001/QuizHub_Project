namespace KvizHub.Domain.Entities
{
    public class UserAnswer : BaseEntity
    {
        public Guid AttemptId { get; set; }
        public Guid QuestionId { get; set; }
        public string SelectedAnswerIds { get; set; } = string.Empty; // JSON array for multiple selections
        public bool IsCorrect { get; set; } = false;
        public int PointsEarned { get; set; } = 0;
        public int TimeSpent { get; set; } = 0; // in seconds
        public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual QuizAttempt Attempt { get; set; } = null!;
        public virtual Question Question { get; set; } = null!;

        public List<Guid> GetSelectedAnswerIds()
        {
            if (string.IsNullOrEmpty(SelectedAnswerIds))
                return new List<Guid>();

            try
            {
                return System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(SelectedAnswerIds) ?? new List<Guid>();
            }
            catch
            {
                return new List<Guid>();
            }
        }

        public void SetSelectedAnswerIds(List<Guid> answerIds)
        {
            SelectedAnswerIds = System.Text.Json.JsonSerializer.Serialize(answerIds);
        }
    }
}