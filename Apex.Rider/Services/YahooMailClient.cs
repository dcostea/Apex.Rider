using Apex.Rider.Models;
using System;
using System.Net;
using System.Net.Mail;

namespace Apex.Rider.Services
{
    public class YahooMailClient : IEmailClient
    {
        Settings _settings;

        public YahooMailClient(Settings settings)
        {
            _settings = settings;
        }

        public void SendEmail(string subject, string body)
        {
            using var mail = new MailMessage();
            mail.From = new MailAddress(_settings.EmailFrom);
            mail.To.Add(_settings.EmailTo);
            mail.Subject = subject;
            mail.Body = body;
            mail.IsBodyHtml = true;

            using var smtp = new SmtpClient(_settings.SmtpServer, _settings.EmailPort);
            smtp.Credentials = new NetworkCredential(_settings.EmailFrom, _settings.Password);
            smtp.EnableSsl = _settings.EnableSsl;
            smtp.Timeout = 5000;

            try
            {
                smtp.Send(mail);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

    }
}
