using FluentValidation;
using KvizHub.Application.Interfaces;
using KvizHub.Infrastructure.Services;
using System.Reflection;

namespace KvizHub.API.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            // Add AutoMapper - scan multiple assemblies
            services.AddAutoMapper(
                typeof(KvizHub.Application.Mappings.MappingProfile).Assembly,
                Assembly.GetExecutingAssembly()
            );

            // Add FluentValidation
            services.AddValidatorsFromAssemblies(new[] {
                typeof(KvizHub.Application.Interfaces.IAuthService).Assembly,
                Assembly.GetExecutingAssembly()
            });

            // Add MediatR
            services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblies(
                typeof(KvizHub.Application.Interfaces.IAuthService).Assembly,
                Assembly.GetExecutingAssembly()
            ));

            // Register application services
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IQuizService, QuizService>();

            // Register repositories
            // services.AddScoped<IQuizRepository, QuizRepository>();
            // services.AddScoped<ICategoryRepository, CategoryRepository>();


            return services;
        }
    }
}