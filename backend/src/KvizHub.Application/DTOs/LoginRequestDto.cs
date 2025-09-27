namespace KvizHub.Application.DTOs;

public record LoginRequestDto(
    string Email,
    string Password
);