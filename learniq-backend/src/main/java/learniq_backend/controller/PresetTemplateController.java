package learniq_backend.controller;

import learniq_backend.model.Test;
import learniq_backend.service.PresetTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/presets")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PresetTemplateController {

    private final PresetTemplateService presetTemplateService;

    @GetMapping
    public ResponseEntity<?> getTemplates() {
        return ResponseEntity.ok(presetTemplateService.getTemplates());
    }

    @PostMapping("/{templateId}/import")
    public ResponseEntity<Test> importTemplate(@PathVariable String templateId) {
        return ResponseEntity.ok(presetTemplateService.importTemplate(templateId));
    }
}
