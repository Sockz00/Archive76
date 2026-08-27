using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Archive76.Application.Composition;

public interface IServiceModule
{
    void ConfigureServices(IServiceCollection services, IConfiguration configuration);
}
