package com.terram.web;

import com.terram.CodeCategory;
import org.springframework.roo.addon.web.mvc.controller.scaffold.RooWebScaffold;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/codecategorys")
@Controller
@RooWebScaffold(path = "codecategorys", formBackingObject = CodeCategory.class)
public class CodeCategoryController {
}
