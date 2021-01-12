namespace Apex.Rider.Models
{
    public class Settings
    {
        public string ApiKey { get; set; }
        public string ApiSecret { get; set; }
        public string ApiUrl { get; set; }
        public string SmtpServer { get; set; }
        public string EmailFrom { get; set; }
        public string EmailTo { get; set; }
        public string Password { get; set; }
        public int EmailPort { get; set; }
        public bool EnableSsl { get; set; }
        public int PriceThreshold { get; set; }
    }
}
