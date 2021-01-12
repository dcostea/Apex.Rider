using Apex.Rider.Models;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Net.Http;
using System.Threading.Tasks;

namespace Apex.Rider.Services
{
    public class ExchangeHttpClient : IHttpClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ExchangeHttpClient> _logger;

        public ExchangeHttpClient(IHttpClientFactory httpClientFactory, ILogger<ExchangeHttpClient> logger)
        {
            _httpClient = httpClientFactory.CreateClient();
            _logger = logger;
        }

        public async Task<ExchangeData> GetAsync(string url)
        {
            try
            {
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<ExchangeResponse>(content);

                return result.ExchangeResult.ExchangeData;
            }
            catch (Exception ex)
            {
                return new();
            }
        }
    }
}
