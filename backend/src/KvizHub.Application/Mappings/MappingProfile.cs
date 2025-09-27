using AutoMapper;
using KvizHub.Application.DTOs;
using KvizHub.Domain.Entities;

namespace KvizHub.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User mappings
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()));

        CreateMap<RegisterRequestDto, User>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Email));

        // Quiz mappings
        CreateMap<Quiz, QuizResponse>()
            .ForMember(dest => dest.QuestionsCount, opt => opt.MapFrom(src => src.QuestionsCount));

        CreateMap<Quiz, QuizListResponse>()
            .ForMember(dest => dest.QuestionsCount, opt => opt.MapFrom(src => src.QuestionsCount));

        CreateMap<CreateQuizRequest, Quiz>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedById, opt => opt.Ignore())
            .ForMember(dest => dest.Questions, opt => opt.Ignore());

        // Question mappings
        CreateMap<Question, QuestionResponse>();
        CreateMap<CreateQuestionRequest, Question>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.QuizId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Answers, opt => opt.Ignore());

        // Answer mappings
        CreateMap<Answer, AnswerResponse>();
        CreateMap<CreateAnswerRequest, Answer>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.QuestionId, opt => opt.Ignore());

        // Category mappings
        CreateMap<Category, CategoryResponse>();
        CreateMap<CreateCategoryRequest, Category>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        // User mappings for quiz responses
        CreateMap<User, UserResponse>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName));

        // Quiz attempt mappings
        CreateMap<QuizAttempt, QuizAttemptResponse>();

        // User answer mappings
        CreateMap<UserAnswer, UserAnswerResponse>()
            .ForMember(dest => dest.SelectedAnswerIds, opt => opt.MapFrom(src => src.GetSelectedAnswerIds()));
    }
}

public record UserDto(string Id, string Email, string FirstName, string LastName);