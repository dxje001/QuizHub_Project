using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using KvizHub.Domain.Entities;
using KvizHub.Domain.Enums;

namespace KvizHub.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            // Ensure database is created
            await context.Database.EnsureCreatedAsync();

            // Run pending migrations
            try
            {
                if ((await context.Database.GetPendingMigrationsAsync()).Any())
                {
                    await context.Database.MigrateAsync();
                }
            }
            catch (Exception ex)
            {
                // Log migration error but continue with seeding
                Console.WriteLine($"Migration error (continuing with seeding): {ex.Message}");
            }

            // Seed roles
            await SeedRolesAsync(roleManager);

            // Seed admin user
            await SeedAdminUserAsync(userManager);

            // Seed test users
            await SeedTestUsersAsync(userManager);

            // Seed categories
            await SeedCategoriesAsync(context);

            // Seed quizzes
            await SeedQuizzesAsync(context, userManager);
        }

        private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
        {
            var roles = new[] { "Admin", "User" };

            foreach (var roleName in roles)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole
                    {
                        Name = roleName,
                        NormalizedName = roleName.ToUpper()
                    });
                }
            }
        }

        private static async Task SeedAdminUserAsync(UserManager<User> userManager)
        {
            var adminEmail = "admin@kvizhub.com";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);

            if (adminUser == null)
            {
                adminUser = new User
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true,
                    FirstName = "Admin",
                    LastName = "User",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(adminUser, "Admin123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }
        }

        private static async Task SeedTestUsersAsync(UserManager<User> userManager)
        {
            var testUsers = new[]
            {
                new { Email = "john.doe@example.com", FirstName = "John", LastName = "Doe", Password = "Test123!" },
                new { Email = "jane.smith@example.com", FirstName = "Jane", LastName = "Smith", Password = "Test123!" },
                new { Email = "mike.johnson@example.com", FirstName = "Mike", LastName = "Johnson", Password = "Test123!" },
                new { Email = "sarah.williams@example.com", FirstName = "Sarah", LastName = "Williams", Password = "Test123!" },
                new { Email = "david.brown@example.com", FirstName = "David", LastName = "Brown", Password = "Test123!" },
                new { Email = "emma.davis@example.com", FirstName = "Emma", LastName = "Davis", Password = "Test123!" },
                new { Email = "james.miller@example.com", FirstName = "James", LastName = "Miller", Password = "Test123!" },
                new { Email = "lisa.wilson@example.com", FirstName = "Lisa", LastName = "Wilson", Password = "Test123!" }
            };

            foreach (var testUserData in testUsers)
            {
                var existingUser = await userManager.FindByEmailAsync(testUserData.Email);
                if (existingUser == null)
                {
                    var testUser = new User
                    {
                        UserName = testUserData.Email,
                        Email = testUserData.Email,
                        EmailConfirmed = true,
                        FirstName = testUserData.FirstName,
                        LastName = testUserData.LastName,
                        CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 30)),
                        UpdatedAt = DateTime.UtcNow
                    };

                    var result = await userManager.CreateAsync(testUser, testUserData.Password);
                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(testUser, "User");
                    }
                }
            }
        }

        private static async Task SeedCategoriesAsync(ApplicationDbContext context)
        {
            if (!await context.Categories.AnyAsync())
            {
                var categories = new[]
                {
                    new Category
                    {
                        Id = Guid.NewGuid(),
                        Name = "General Knowledge",
                        Description = "Questions covering various topics and general knowledge",
                        Icon = "🧠",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Category
                    {
                        Id = Guid.NewGuid(),
                        Name = "Science",
                        Description = "Physics, Chemistry, Biology and other scientific topics",
                        Icon = "🔬",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Category
                    {
                        Id = Guid.NewGuid(),
                        Name = "Technology",
                        Description = "Programming, Computer Science and Technology",
                        Icon = "💻",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Category
                    {
                        Id = Guid.NewGuid(),
                        Name = "History",
                        Description = "Historical events, figures and dates",
                        Icon = "📚",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Category
                    {
                        Id = Guid.NewGuid(),
                        Name = "Sports",
                        Description = "Sports knowledge, athletes and competitions",
                        Icon = "⚽",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Category
                    {
                        Id = Guid.NewGuid(),
                        Name = "Entertainment",
                        Description = "Movies, Music, TV Shows and Pop Culture",
                        Icon = "🎬",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Category
                    {
                        Id = Guid.NewGuid(),
                        Name = "Geography",
                        Description = "Countries, capitals, continents and geographical features",
                        Icon = "🌍",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };

                context.Categories.AddRange(categories);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedQuizzesAsync(ApplicationDbContext context, UserManager<User> userManager)
        {
            if (await context.Quizzes.CountAsync() == 0) // Only add if we have no quizzes
            {
                var categories = await context.Categories.ToListAsync();
                var adminUser = await userManager.FindByEmailAsync("admin@kvizhub.com");
                var testUsers = await userManager.Users.Where(u => u.Email != "admin@kvizhub.com").Take(3).ToListAsync();

                if (categories.Any() && adminUser != null)
                {
                    var techCategory = categories.FirstOrDefault(c => c.Name == "Technology");
                    var scienceCategory = categories.FirstOrDefault(c => c.Name == "Science");
                    var geographyCategory = categories.FirstOrDefault(c => c.Name == "Geography");
                    var historyCategory = categories.FirstOrDefault(c => c.Name == "History");

                    if (techCategory == null || scienceCategory == null || geographyCategory == null || historyCategory == null)
                    {
                        return; // Skip seeding if any required category doesn't exist
                    }

                    var quizzes = new[]
                    {
                        new Quiz
                        {
                            Id = Guid.NewGuid(),
                            Title = "Advanced JavaScript Concepts",
                            Description = "Test your knowledge of advanced JavaScript features like closures, promises, and async/await",
                            CategoryId = techCategory.Id,
                            Difficulty = (QuizDifficulty)3,
                            TimeLimit = 20,
                            IsPublic = true,
                            CreatedById = adminUser.Id,
                            CreatedAt = DateTime.UtcNow.AddDays(-10),
                            UpdatedAt = DateTime.UtcNow.AddDays(-10)
                        },
                        new Quiz
                        {
                            Id = Guid.NewGuid(),
                            Title = "Physics Fundamentals",
                            Description = "Basic physics concepts covering mechanics, thermodynamics, and electricity",
                            CategoryId = scienceCategory.Id,
                            Difficulty = (QuizDifficulty)2,
                            TimeLimit = 25,
                            IsPublic = true,
                            CreatedById = testUsers.Any() ? testUsers[0].Id : adminUser.Id,
                            CreatedAt = DateTime.UtcNow.AddDays(-8),
                            UpdatedAt = DateTime.UtcNow.AddDays(-8)
                        },
                        new Quiz
                        {
                            Id = Guid.NewGuid(),
                            Title = "World Geography Quiz",
                            Description = "Test your knowledge of countries, capitals, and geographical features",
                            CategoryId = geographyCategory.Id,
                            Difficulty = (QuizDifficulty)1,
                            TimeLimit = 15,
                            IsPublic = true,
                            CreatedById = testUsers.Count > 1 ? testUsers[1].Id : adminUser.Id,
                            CreatedAt = DateTime.UtcNow.AddDays(-5),
                            UpdatedAt = DateTime.UtcNow.AddDays(-5)
                        },
                        new Quiz
                        {
                            Id = Guid.NewGuid(),
                            Title = "Ancient History",
                            Description = "Explore ancient civilizations, empires, and historical events",
                            CategoryId = historyCategory.Id,
                            Difficulty = (QuizDifficulty)2,
                            TimeLimit = 30,
                            IsPublic = true,
                            CreatedById = testUsers.Count > 2 ? testUsers[2].Id : adminUser.Id,
                            CreatedAt = DateTime.UtcNow.AddDays(-3),
                            UpdatedAt = DateTime.UtcNow.AddDays(-3)
                        },
                        new Quiz
                        {
                            Id = Guid.NewGuid(),
                            Title = "React Development",
                            Description = "Modern React development with hooks, context, and best practices",
                            CategoryId = techCategory.Id,
                            Difficulty = (QuizDifficulty)2,
                            TimeLimit = 18,
                            IsPublic = true,
                            CreatedById = adminUser.Id,
                            CreatedAt = DateTime.UtcNow.AddDays(-1),
                            UpdatedAt = DateTime.UtcNow.AddDays(-1)
                        }
                    };

                    context.Quizzes.AddRange(quizzes);
                    await context.SaveChangesAsync();

                    // Add questions to each quiz
                    await SeedQuizQuestionsAsync(context, quizzes);
                }
            }
        }

        private static async Task SeedQuizQuestionsAsync(ApplicationDbContext context, Quiz[] quizzes)
        {
            foreach (var quiz in quizzes)
            {
                if (!await context.Questions.AnyAsync(q => q.QuizId == quiz.Id))
                {
                    var questions = GetQuestionsForQuiz(quiz);
                    context.Questions.AddRange(questions);
                    await context.SaveChangesAsync();

                    // Add answers for each question
                    foreach (var question in questions)
                    {
                        var answers = GetAnswersForQuestion(question);
                        context.Answers.AddRange(answers);
                    }
                    await context.SaveChangesAsync();
                }
            }
        }

        private static List<Question> GetQuestionsForQuiz(Quiz quiz)
        {
            return quiz.Title switch
            {
                "Advanced JavaScript Concepts" => new List<Question>
                {
                    new Question { Id = Guid.NewGuid(), QuizId = quiz.Id, QuestionText = "What is a closure in JavaScript?", Points = 2, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Question { Id = Guid.NewGuid(), QuizId = quiz.Id, QuestionText = "What does 'async/await' do in JavaScript?", Points = 2, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Question { Id = Guid.NewGuid(), QuizId = quiz.Id, QuestionText = "What is the difference between 'let' and 'var'?", Points = 1, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "Physics Fundamentals" => new List<Question>
                {
                    new Question { Id = Guid.NewGuid(), QuizId = quiz.Id, QuestionText = "What is Newton's first law of motion?", Points = 2, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Question { Id = Guid.NewGuid(), QuizId = quiz.Id, QuestionText = "What is the unit of force?", Points = 1, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Question { Id = Guid.NewGuid(), QuizId = quiz.Id, QuestionText = "What is the speed of light in vacuum?", Points = 2, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "World Geography Quiz" => new List<Question>
                {
                    new Question { Id = Guid.NewGuid(), QuizId = quiz.Id, QuestionText = "What is the capital of Australia?", Points = 1, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Question { Id = Guid.NewGuid(), QuizId = quiz.Id, QuestionText = "Which is the largest continent?", Points = 1, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Question { Id = Guid.NewGuid(), QuizId = quiz.Id, QuestionText = "What is the longest river in the world?", Points = 1, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "Ancient History" => new List<Question>
                {
                    new Question { Id = Guid.NewGuid(), QuizId = quiz.Id, QuestionText = "Who was the first emperor of Rome?", Points = 2, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Question { Id = Guid.NewGuid(), QuizId = quiz.Id, QuestionText = "When was the Great Pyramid of Giza built?", Points = 2, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Question { Id = Guid.NewGuid(), QuizId = quiz.Id, QuestionText = "Which ancient wonder was located in Alexandria?", Points = 1, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "React Development" => new List<Question>
                {
                    new Question { Id = Guid.NewGuid(), QuizId = quiz.Id, QuestionText = "What is the purpose of useEffect hook?", Points = 2, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Question { Id = Guid.NewGuid(), QuizId = quiz.Id, QuestionText = "How do you pass data between components?", Points = 1, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Question { Id = Guid.NewGuid(), QuizId = quiz.Id, QuestionText = "What is JSX?", Points = 1, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                _ => new List<Question>()
            };
        }

        private static List<Answer> GetAnswersForQuestion(Question question)
        {
            return question.QuestionText switch
            {
                "What is a closure in JavaScript?" => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "A function that has access to variables from its outer scope", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "A way to close browser windows", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "A type of loop", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "What does 'async/await' do in JavaScript?" => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Handles asynchronous operations in a synchronous way", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Creates async functions only", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Waits for user input", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "What is the capital of Australia?" => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Canberra", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Sydney", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Melbourne", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "What is Newton's first law of motion?" => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "An object at rest stays at rest, and an object in motion stays in motion", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Force equals mass times acceleration", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Every action has an equal and opposite reaction", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "What is the unit of force?" => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Newton", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Joule", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Watt", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Pascal", IsCorrect = false, Order = 4, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "What is the speed of light in vacuum?" => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "300,000 km/s", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "150,000 km/s", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "450,000 km/s", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "Which is the largest continent?" => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Asia", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Africa", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "North America", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Europe", IsCorrect = false, Order = 4, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "What is the longest river in the world?" => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Nile River", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Amazon River", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Mississippi River", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Yangtze River", IsCorrect = false, Order = 4, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "Who was the first emperor of Rome?" => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Augustus Caesar", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Julius Caesar", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Marcus Aurelius", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Nero", IsCorrect = false, Order = 4, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "When was the Great Pyramid of Giza built?" => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Around 2580-2560 BC", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Around 1500 BC", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Around 3000 BC", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Around 1000 BC", IsCorrect = false, Order = 4, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "Which ancient wonder was located in Alexandria?" => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "The Lighthouse of Alexandria", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "The Colossus of Rhodes", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "The Hanging Gardens of Babylon", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "The Statue of Zeus", IsCorrect = false, Order = 4, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "What is the purpose of useEffect hook?" => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "To handle side effects in functional components", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "To create state variables", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "To render JSX elements", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "To handle user events", IsCorrect = false, Order = 4, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "How do you pass data between components?" => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Using props and callbacks", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Using global variables", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Using localStorage only", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Using CSS classes", IsCorrect = false, Order = 4, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "What is JSX?" => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "A syntax extension for JavaScript that looks like HTML", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "A new JavaScript framework", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "A CSS preprocessor", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "A database query language", IsCorrect = false, Order = 4, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                "What is the difference between 'let' and 'var'?" => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "'let' has block scope, 'var' has function scope", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "'let' is faster than 'var'", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "There is no difference", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "'var' is more modern than 'let'", IsCorrect = false, Order = 4, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                },
                _ => new List<Answer>
                {
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Option A", IsCorrect = true, Order = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Option B", IsCorrect = false, Order = 2, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    new Answer { Id = Guid.NewGuid(), QuestionId = question.Id, AnswerText = "Option C", IsCorrect = false, Order = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                }
            };
        }
    }
}