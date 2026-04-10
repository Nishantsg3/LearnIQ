package learniq_backend.service;

import learniq_backend.model.Question;
import learniq_backend.model.Test;
import learniq_backend.repository.QuestionRepository;
import learniq_backend.repository.TestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PresetTemplateService {

    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;

    public List<PresetTemplate> getTemplates() {
        return List.of(
                template("java-beg-1", "Java Basics Draft 1", "Java", "PRACTICE", "Easy", 5, 15, javaQuestionsOne()),
                template("java-int-2", "Java OOP Draft 2", "Java", "MAIN", "Medium", 5, 20, javaQuestionsTwo()),
                template("python-beg-1", "Python Fundamentals Draft 1", "Python", "PRACTICE", "Easy", 5, 15, pythonQuestionsOne()),
                template("python-int-2", "Python Data Structures Draft 2", "Python", "MAIN", "Medium", 5, 20, pythonQuestionsTwo()),
                template("dotnet-beg-1", ".NET Essentials Draft 1", ".NET", "PRACTICE", "Easy", 5, 15, dotnetQuestionsOne()),
                template("dotnet-int-2", ".NET C# Draft 2", ".NET", "MAIN", "Medium", 5, 20, dotnetQuestionsTwo()),
                template("cloud-beg-1", "Cloud Concepts Draft 1", "Cloud", "PRACTICE", "Easy", 5, 15, cloudQuestionsOne()),
                template("cloud-int-2", "Cloud Services Draft 2", "Cloud", "MAIN", "Medium", 5, 20, cloudQuestionsTwo()),
                template("apt-beg-1", "Aptitude Quant Draft 1", "Aptitude", "PRACTICE", "Easy", 5, 15, aptitudeQuestionsOne()),
                template("apt-int-2", "Aptitude Logic Draft 2", "Aptitude", "MAIN", "Medium", 5, 20, aptitudeQuestionsTwo())
        );
    }

    public Test importTemplate(String templateId) {
        PresetTemplate preset = getTemplates().stream()
                .filter(template -> template.id().equals(templateId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));

        Test test = Test.builder()
                .title(preset.title())
                .category(preset.category())
                .sectionType(preset.sectionType())
                .difficultyLevel(preset.difficultyLevel())
                .questionCount(preset.questions().size())
                .durationMinutes(preset.durationMinutes())
                .scheduledAt("MAIN".equals(preset.sectionType()) ? LocalDateTime.now().plusDays(1) : null)
                .description("Imported from preset draft bank")
                .status("MAIN".equals(preset.sectionType()) ? "SCHEDULED" : "DRAFT")
                .build();

        Test savedTest = testRepository.save(test);

        List<Question> questions = preset.questions().stream()
                .map(item -> Question.builder()
                        .questionText(item.questionText())
                        .optionA(item.optionA())
                        .optionB(item.optionB())
                        .optionC(item.optionC())
                        .optionD(item.optionD())
                        .correctAnswer(item.correctAnswer())
                        .category(preset.category())
                        .difficultyLevel(preset.difficultyLevel())
                        .test(savedTest)
                        .build())
                .toList();

        questionRepository.saveAll(questions);
        return savedTest;
    }

    private PresetTemplate template(String id, String title, String category, String sectionType, String difficulty, int count, int duration, List<PresetQuestion> questions) {
        return new PresetTemplate(id, title, category, sectionType, difficulty, count, duration, questions);
    }

    private List<PresetQuestion> javaQuestionsOne() {
        return List.of(
                q("Which keyword is used to inherit a class in Java?", "implements", "extends", "inherits", "super", "B"),
                q("Which JVM memory area stores objects?", "Stack", "Heap", "Register", "Method parameter list", "B"),
                q("Which collection does not allow duplicates?", "List", "Queue", "Set", "Vector", "C"),
                q("Which access modifier gives widest access?", "private", "protected", "default", "public", "D"),
                q("Which method starts a Java application?", "run()", "init()", "main()", "start()", "C")
        );
    }

    private List<PresetQuestion> javaQuestionsTwo() {
        return List.of(
                q("What is method overloading?", "Same method name with different parameters", "Same class name twice", "Extending multiple classes", "Using static methods only", "A"),
                q("Which interface is used to sort custom objects naturally?", "Runnable", "Serializable", "Comparable", "Cloneable", "C"),
                q("What does encapsulation mean?", "Hiding data with methods", "Running in parallel", "Inheriting many classes", "Deleting objects", "A"),
                q("Which stream is used for byte output?", "Reader", "Writer", "InputStream", "OutputStream", "D"),
                q("Which feature handles runtime errors in Java?", "Polymorphism", "Exception handling", "Garbage collection", "Packages", "B")
        );
    }

    private List<PresetQuestion> pythonQuestionsOne() {
        return List.of(
                q("Which symbol starts a comment in Python?", "//", "#", "/*", "--", "B"),
                q("Which type is immutable?", "list", "dict", "set", "tuple", "D"),
                q("Which keyword defines a function?", "func", "define", "def", "lambda", "C"),
                q("What does len() return?", "Data type", "Memory size", "Number of items", "Index of last item", "C"),
                q("Which loop is used for iteration over sequences?", "switch", "for", "case", "goto", "B")
        );
    }

    private List<PresetQuestion> pythonQuestionsTwo() {
        return List.of(
                q("Which structure uses key-value pairs?", "list", "tuple", "dictionary", "string", "C"),
                q("Which keyword handles exceptions?", "try", "check", "catch", "final", "A"),
                q("Which module is commonly used for JSON parsing?", "math", "json", "sys", "random", "B"),
                q("What is the output type of range(5)?", "list", "tuple", "range object", "set", "C"),
                q("Which function is used to read user input?", "scan()", "read()", "input()", "accept()", "C")
        );
    }

    private List<PresetQuestion> dotnetQuestionsOne() {
        return List.of(
                q("C# code is primarily written for which platform family?", ".NET", "JVM", "PHP", "Node", "A"),
                q("Which keyword is used to define a class in C#?", "class", "struct", "object", "define", "A"),
                q("Which method is the common entry point in C#?", "run()", "main()", "Main()", "start()", "C"),
                q("Which symbol ends a statement in C#?", ":", ".", ";", ",", "C"),
                q("Which access modifier makes members visible everywhere?", "private", "public", "internal", "sealed", "B")
        );
    }

    private List<PresetQuestion> dotnetQuestionsTwo() {
        return List.of(
                q("Which feature lets a method have same name but different parameters in C#?", "Overriding", "Overloading", "Casting", "Boxing", "B"),
                q("Which collection stores items as key-value pairs in C#?", "List", "Queue", "Dictionary", "Array", "C"),
                q("What does CLR stand for?", "Common Language Runtime", "Core Language Resource", "Common Logic Runtime", "Class Loader Runtime", "A"),
                q("Which keyword is used to inherit in C#?", "inherits", "extends", "base", ":", "D"),
                q("Which statement handles exceptions?", "if", "try-catch", "loop", "using", "B")
        );
    }

    private List<PresetQuestion> cloudQuestionsOne() {
        return List.of(
                q("What does cloud computing provide over the internet?", "Only storage", "Only coding tools", "On-demand computing services", "Only operating systems", "C"),
                q("Which is an example of IaaS?", "Virtual machine", "Email app", "Word processor", "Browser", "A"),
                q("Which deployment model is owned by one organization?", "Public cloud", "Hybrid cloud", "Private cloud", "Community internet", "C"),
                q("What is scalability in cloud?", "More office space", "Growing resources when needed", "Deleting backups", "Buying hardware every month", "B"),
                q("Which provider is a major cloud platform?", "AWS", "MySQL", "Bootstrap", "Figma", "A")
        );
    }

    private List<PresetQuestion> cloudQuestionsTwo() {
        return List.of(
                q("Which service model gives ready-to-use software?", "IaaS", "PaaS", "SaaS", "DaaS", "C"),
                q("What is elasticity in cloud?", "Manual hardware repair", "Automatic resource adjustment", "Permanent VM deletion", "Static scaling", "B"),
                q("Which cloud concept improves availability by using multiple zones?", "Replication", "Compilation", "Compression", "Tokenization", "A"),
                q("What does CDN mainly improve?", "Typing speed", "Content delivery speed", "Code syntax", "Database schema", "B"),
                q("Which storage is object-based in cloud platforms?", "Blob storage", "CPU cache", "RAM", "Clipboard", "A")
        );
    }

    private List<PresetQuestion> aptitudeQuestionsOne() {
        return List.of(
                q("What is 15% of 200?", "20", "25", "30", "35", "C"),
                q("If a train runs 60 km in 1 hour, its speed is?", "30 km/h", "60 km/h", "90 km/h", "120 km/h", "B"),
                q("What is the next number: 2, 4, 8, 16, ?", "18", "24", "32", "64", "C"),
                q("A shop gives 10% discount on 500. Final price?", "450", "400", "475", "490", "A"),
                q("Which is the odd one out?", "2", "4", "6", "9", "D")
        );
    }

    private List<PresetQuestion> aptitudeQuestionsTwo() {
        return List.of(
                q("If all roses are flowers and some flowers fade quickly, which is true?", "All roses fade quickly", "Some roses may fade quickly", "No roses are flowers", "Only flowers are roses", "B"),
                q("Find the odd one: Triangle, Square, Circle, Cube", "Triangle", "Square", "Circle", "Cube", "D"),
                q("What comes next: AZ, BY, CX, ?", "DW", "DX", "EV", "FW", "A"),
                q("If today is Monday, 10 days later is?", "Wednesday", "Thursday", "Friday", "Saturday", "B"),
                q("Statement: Some books are pens. Conclusion: Some pens are books.", "True", "False", "Cannot say", "None", "A")
        );
    }

    private PresetQuestion q(String questionText, String optionA, String optionB, String optionC, String optionD, String correctAnswer) {
        return new PresetQuestion(questionText, optionA, optionB, optionC, optionD, correctAnswer);
    }

    public record PresetTemplate(
            String id,
            String title,
            String category,
            String sectionType,
            String difficultyLevel,
            int questionCount,
            int durationMinutes,
            List<PresetQuestion> questions
    ) {}

    public record PresetQuestion(
            String questionText,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            String correctAnswer
    ) {}
}
