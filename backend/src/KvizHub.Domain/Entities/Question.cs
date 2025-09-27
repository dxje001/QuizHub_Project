using KvizHub.Domain.Enums;

namespace KvizHub.Domain.Entities
{
    public class Question : BaseEntity
    {
        public Guid QuizId { get; set; }
        public QuestionType Type { get; set; } = QuestionType.MultipleChoice;
        public string QuestionText { get; set; } = string.Empty;
        public int Points { get; set; } = 1;
        public int? TimeLimit { get; set; } // in seconds
        public int Order { get; set; } = 0;

        // Navigation properties
        public virtual Quiz Quiz { get; set; } = null!;
        public virtual ICollection<Answer> Answers { get; set; } = new List<Answer>();
        public virtual ICollection<UserAnswer> UserAnswers { get; set; } = new List<UserAnswer>();
    }
}