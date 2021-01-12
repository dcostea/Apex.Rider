namespace Apex.Rider.Services
{
    public interface IEmailClient
    {
        public void SendEmail(string subject, string body);
    }
}