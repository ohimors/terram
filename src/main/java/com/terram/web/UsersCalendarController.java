package com.terram.web;

import com.terram.UsersCalendar;
import org.springframework.roo.addon.web.mvc.controller.scaffold.RooWebScaffold;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/userscalendars")
@Controller
@RooWebScaffold(path = "userscalendars", formBackingObject = UsersCalendar.class)
public class UsersCalendarController {
}
