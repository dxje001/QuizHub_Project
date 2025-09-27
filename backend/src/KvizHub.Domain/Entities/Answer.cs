namespace KvizHub.Domain.Entities
{
    public class Answer : BaseEntity
    {
        public Guid QuestionId { get; set; }
        public string AnswerText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; } = false;
        public int Order { get; set; } = 0;

        // Navigation properties
        public virtual Question Question { get; set; } = null!;
    }
}