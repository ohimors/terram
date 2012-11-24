package com.terram.web;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailSender;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@RequestMapping("/publiclogin/**")
@Controller
public class PublicLoginController {
	
	 public static Logger logger = Logger.getLogger(PublicLoginController.class);
	
    @Autowired
    private transient MailSender mailTemplate;
    
    @RequestMapping(method = RequestMethod.POST, value = "{id}")
    public void post(@PathVariable Long id, ModelMap modelMap, HttpServletRequest request, HttpServletResponse response) {
    }

    @RequestMapping
    public String index() {
        return "publiclogin/index";
    }

    public void sendMessage(String mailFrom, String subject, String mailTo, String message) {
        org.springframework.mail.SimpleMailMessage mailMessage = new org.springframework.mail.SimpleMailMessage();
        mailMessage.setFrom(mailFrom);
        mailMessage.setSubject(subject);
        mailMessage.setTo(mailTo);
        mailMessage.setText(message);
        mailTemplate.send(mailMessage);
    }
    
    @RequestMapping(value="/", method= RequestMethod.GET )
    public void mainPage(Model model){ 
    	
    	 Authentication auth = SecurityContextHolder.getContext().getAuthentication();
         String name = auth.getName(); //get logged in username
         logger.info("=================== name of logged in user: "+name);
         model.addAttribute("username", name);
    }
}
