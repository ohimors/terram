package com.terram.web;

import com.terram.Calendar;
import org.springframework.roo.addon.web.mvc.controller.scaffold.RooWebScaffold;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/calendars")
@Controller
@RooWebScaffold(path = "calendars", formBackingObject = Calendar.class)
public class CalendarController {
}
