package com.enterprise.telemetry.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebViewController {
    @GetMapping(value = "/{path:[^\\.]*}")
    public String forward() {
        return "forward:/index.html";
    }
}