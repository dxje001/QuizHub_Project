using KvizHub.Domain.Enums;

namespace KvizHub.Domain.Entities
{
    public class Quiz : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Guid CategoryId { get; set; }
        public QuizDifficulty Difficulty { get; set; } = QuizDifficulty.Easy;
        public int? TimeLimit { get; set; } // in minutes
        public bool IsPublic { get; set; } = true;
        public string CreatedById { get; set; } = string.Empty;

        // Navigation properties
        public virtual Category Category { get; set; } = null!;
        public virtual User CreatedBy { get; set; } = null!;
        public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
        public virtual ICollection<QuizAttempt> Attempts { get; set; } = new List<QuizAttempt>();

        public int QuestionsCount => Questions.Count;
    }
}