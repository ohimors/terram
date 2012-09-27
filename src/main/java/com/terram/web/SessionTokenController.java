package com.terram.web;

import com.terram.SessionToken;
import org.springframework.roo.addon.web.mvc.controller.scaffold.RooWebScaffold;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/sessiontokens")
@Controller
@RooWebScaffold(path = "sessiontokens", formBackingObject = SessionToken.class)
public class SessionTokenController {
}
