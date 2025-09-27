namespace KvizHub.Domain.Entities
{
    public class Category : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Icon { get; set; }

        // Navigation properties
        public virtual ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    }
}