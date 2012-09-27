package com.terram.web;

import com.terram.Code;
import org.springframework.roo.addon.web.mvc.controller.scaffold.RooWebScaffold;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/codes")
@Controller
@RooWebScaffold(path = "codes", formBackingObject = Code.class)
public class CodeController {
}
