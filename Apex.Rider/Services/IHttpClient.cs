using Apex.Rider.Models;
using System.Threading.Tasks;

namespace Apex.Rider.Services
{
    public interface IHttpClient
    {
        public Task<ExchangeData> GetAsync(string url);
    }
}