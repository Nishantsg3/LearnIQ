package learniq_backend.service;

import learniq_backend.model.*;
import learniq_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DataSeederService {

    private final UserRepository userRepository;
    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final AttemptService attemptService;
    private final TestAttemptRepository testAttemptRepository;
    private final org.springframework.transaction.support.TransactionTemplate transactionTemplate;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Value("${app.seed.admin.email}")
    private String adminEmail;

    @Value("${app.seed.admin.password}")
    private String adminPassword;

    @Value("${app.seed.admin.name}")
    private String adminName;

    @Transactional
    public void resetAndSeed() {
        try {
            seedUsers();
            
            // 🚀 NUCLEAR RESET: Wipe everything for a clean slate
            System.out.println("[NUCLEAR] Wiping all test history and active records...");
            jdbcTemplate.update("DELETE FROM attempt_answers");
            jdbcTemplate.update("DELETE FROM test_attempts");
            jdbcTemplate.update("DELETE FROM test_questions");
            jdbcTemplate.update("DELETE FROM test");
            
            System.out.println("[SEEDER] System wipe complete. Ready for fresh start.");
        } catch (Exception e) {
            System.err.println("[SEEDER] Reset failure: " + e.getMessage());
        }
    }

    private void seedUsers() {
        // 1. SEED ADMIN
        userRepository.findByEmail(adminEmail).ifPresentOrElse(
            admin -> {
                admin.setName(adminName);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setRole(User.Role.ADMIN);
                admin.setVerified(true);
                userRepository.save(admin);
            },
            () -> {
                User admin = new User();
                admin.setEmail(adminEmail);
                admin.setName(adminName);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setRole(User.Role.ADMIN);
                admin.setVerified(true);
                userRepository.save(admin);
            }
        );

        // 2. SEED/MIGRATE STUDENTS
        Map<String, String[]> migrations = Map.of(
            "student1@test.com", new String[]{"student1@learniq.com", "student@111"},
            "student2@test.com", new String[]{"student2@learniq.com", "student@222"},
            "student3@test.com", new String[]{"student3@learniq.com", "student@333"}
        );

        for (Map.Entry<String, String[]> entry : migrations.entrySet()) {
            String newEmail = entry.getValue()[0];
            String password = entry.getValue()[1];

            userRepository.findByEmail(newEmail).ifPresentOrElse(u -> {
                u.setPassword(passwordEncoder.encode(password));
                u.setRole(User.Role.STUDENT);
                u.setVerified(true);
                userRepository.save(u);
            }, () -> {
                User u = new User();
                u.setEmail(newEmail);
                u.setName(newEmail.split("@")[0].toUpperCase());
                u.setPassword(passwordEncoder.encode(password));
                u.setRole(User.Role.STUDENT);
                u.setVerified(true);
                userRepository.save(u);
            });
        }
    }

    private void seedQuestions() {
        long currentCount = questionRepository.count();
        System.out.println("[SEEDER] Current Question Bank Count: " + currentCount);

        if (currentCount > 0) {
            System.out.println("[SEEDER] Question Bank already populated. Skipping auto-seed to prevent data modification.");
            return;
        }

        System.out.println("[SEEDER] Question Bank is empty. Initializing baseline intelligence...");
        List<Question> qb = new ArrayList<>();

        // JAVA (10)
        addQ(qb, "JAVA", "Which of the following is not a Java feature?", "Dynamic", "Architecture Neutral", "Use of pointers", "Object-oriented", "Use of pointers");
        addQ(qb, "JAVA", "What is the return type of the hashCode() method?", "Object", "int", "long", "void", "int");
        addQ(qb, "JAVA", "Which package contains the Random class?", "java.io", "java.util", "java.lang", "java.net", "java.util");
        addQ(qb, "JAVA", "Default value of boolean variable?", "true", "false", "null", "0", "false");
        addQ(qb, "JAVA", "Which keyword is used to access features of a package?", "package", "import", "extends", "export", "import");
        addQ(qb, "JAVA", "Size of int in Java?", "16 bit", "32 bit", "64 bit", "8 bit", "32 bit");
        addQ(qb, "JAVA", "Superclass of all classes in Java?", "Class", "Object", "System", "String", "Object");
        addQ(qb, "JAVA", "Which method starts thread execution?", "run()", "start()", "execute()", "init()", "start()");
        addQ(qb, "JAVA", "Which of these is used to handle exceptions?", "try", "catch", "throw", "All of the above", "All of the above");
        addQ(qb, "JAVA", "Java is a ______ language.", "Compiled", "Interpreted", "Both", "None", "Both");

        // PYTHON (10)
        addQ(qb, "PYTHON", "Keyword to create a function?", "function", "def", "func", "create", "def");
        addQ(qb, "PYTHON", "Correct file extension for Python?", ".py", ".python", ".pyt", ".pt", ".py");
        addQ(qb, "PYTHON", "Single-line comment character?", "//", "/*", "#", "--", "#");
        addQ(qb, "PYTHON", "Output of print(2 ** 3)?", "6", "8", "9", "5", "8");
        addQ(qb, "PYTHON", "Which data type is immutable?", "list", "dict", "set", "tuple", "tuple");
        addQ(qb, "PYTHON", "How to start a for loop?", "for x in y:", "for x to y:", "for x ; y", "foreach x in y", "for x in y:");
        addQ(qb, "PYTHON", "Method to remove end whitespace?", "trim()", "strip()", "cut()", "replace()", "strip()");
        addQ(qb, "PYTHON", "Correct way to create a dictionary?", "[]", "()", "{}", "<>", "{}");
        addQ(qb, "PYTHON", "Function to get length of a list?", "size()", "count()", "len()", "length()", "len()");
        addQ(qb, "PYTHON", "Python was created by?", "Dennis Ritchie", "Guido van Rossum", "Bjarne Stroustrup", "James Gosling", "Guido van Rossum");

        // DBMS (10)
        addQ(qb, "DBMS", "What does SQL stand for?", "Simple Query Logic", "Structured Query Language", "Standard Query List", "Sequential Query Link", "Structured Query Language");
        addQ(qb, "DBMS", "Statement to extract data?", "GET", "EXTRACT", "SELECT", "OPEN", "SELECT");
        addQ(qb, "DBMS", "Statement to update data?", "SAVE", "MODIFY", "UPDATE", "CHANGE", "UPDATE");
        addQ(qb, "DBMS", "Statement to delete data?", "REMOVE", "DROP", "DELETE", "TRUNCATE", "DELETE");
        addQ(qb, "DBMS", "Select all columns from 'Persons'?", "SELECT Persons", "SELECT * FROM Persons", "SELECT [all] FROM Persons", "SHOW Persons", "SELECT * FROM Persons");
        addQ(qb, "DBMS", "Keyword to sort result-set?", "SORT BY", "ORDER BY", "GROUP BY", "ARRANGE BY", "ORDER BY");
        addQ(qb, "DBMS", "Most common type of join?", "OUTER JOIN", "INNER JOIN", "CROSS JOIN", "NATURAL JOIN", "INNER JOIN");
        addQ(qb, "DBMS", "What is a primary key?", "Unique identifier", "Foreign reference", "Index", "Table name", "Unique identifier");
        addQ(qb, "DBMS", "ACID: What does 'A' stand for?", "Atomicity", "Availability", "Accuracy", "Automation", "Atomicity");
        addQ(qb, "DBMS", "Constraint for unique values?", "NOT NULL", "UNIQUE", "PRIMARY", "CHECK", "UNIQUE");

        // APTITUDE (10)
        addQ(qb, "APTITUDE", "Average of first five multiples of 3?", "7", "9", "12", "15", "9");
        addQ(qb, "APTITUDE", "Prime number among these?", "15", "21", "31", "27", "31");
        addQ(qb, "APTITUDE", "Ratio 5:4 as a percent?", "80%", "125%", "120%", "75%", "125%");
        addQ(qb, "APTITUDE", "A clock shows 3:00. Angle between hands?", "90", "180", "45", "120", "90");
        addQ(qb, "APTITUDE", "Next in series: 7, 10, 8, 11, 9, 12, ...?", "7", "10", "13", "11", "10");
        addQ(qb, "APTITUDE", "Cube root of 1331?", "11", "12", "13", "14", "11");
        addQ(qb, "APTITUDE", "If 20% of a = b, then b% of 20 is?", "4% of a", "5% of a", "20% of a", "None", "4% of a");
        addQ(qb, "APTITUDE", "Sum of angles in a triangle?", "90", "180", "360", "270", "180");
        addQ(qb, "APTITUDE", "Square root of 625?", "15", "25", "35", "45", "25");
        addQ(qb, "APTITUDE", "0.003 * 0.02 = ?", "0.06", "0.006", "0.0006", "0.00006", "0.00006");

        // CLOUD (10)
        addQ(qb, "CLOUD", "What does AWS stand for?", "Advanced Web System", "Amazon Web Services", "Apple Web Site", "All Web Services", "Amazon Web Services");
        addQ(qb, "CLOUD", "Service for scalable computing in AWS?", "S3", "EC2", "RDS", "Lambda", "EC2");
        addQ(qb, "CLOUD", "What does S3 stand for?", "Simple Storage Service", "Super Storage System", "Standard Site Service", "Shared Storage Space", "Simple Storage Service");
        addQ(qb, "CLOUD", "Combination of public and private clouds?", "Hybrid Cloud", "Multi Cloud", "Community Cloud", "Personal Cloud", "Hybrid Cloud");
        addQ(qb, "CLOUD", "Primary benefit of cloud computing?", "Cost", "Scalability", "Hardware", "Security", "Scalability");
        addQ(qb, "CLOUD", "Service for DNS in AWS?", "S3", "Route 53", "CloudFront", "IAM", "Route 53");
        addQ(qb, "CLOUD", "What is PaaS?", "Platform as a Service", "Product as a Service", "Process as a Service", "Personal as a Service", "Platform as a Service");
        addQ(qb, "CLOUD", "Cloud provider for Azure?", "Google", "Amazon", "Microsoft", "IBM", "Microsoft");
        addQ(qb, "CLOUD", "Virtual computer in the cloud?", "Instance", "Node", "Pod", "Cluster", "Instance");
        addQ(qb, "CLOUD", "AWS serverless functions service?", "EC2", "Lambda", "Fargate", "Batch", "Lambda");

        // ASP.NET (10)
        addQ(qb, "ASP.NET", "What does ASP.NET stand for?", "Active Server Pages", "Advanced Service Provider", "Application Server Protocol", "All Server Power", "Active Server Pages");
        addQ(qb, "ASP.NET", "Primary language for ASP.NET?", "C#", "VB", "Java", "Python", "C#");
        addQ(qb, "ASP.NET", "Primary view engine in MVC?", "Razor", "Blazor", "WebForms", "Spark", "Razor");
        addQ(qb, "ASP.NET", "Config file for ASP.NET?", "web.xml", "Web.config", "settings.json", "app.props", "Web.config");
        addQ(qb, "ASP.NET", "Base class for MVC controllers?", "BaseController", "Controller", "ApiController", "RouteController", "Controller");
        addQ(qb, "ASP.NET", "Middleware for routing in Core?", "RouteMiddleware", "Routing Middleware", "DefaultRouter", "MapRoute", "Routing Middleware");
        addQ(qb, "ASP.NET", "Method to return a view?", "View()", "ReturnView()", "Show()", "Render()", "View()");
        addQ(qb, "ASP.NET", "Purpose of NuGet?", "Testing", "Package Management", "Deployment", "Debugging", "Package Management");
        addQ(qb, "ASP.NET", "Attribute for defining routes?", "[Route]", "[Path]", "[Url]", "[Link]", "[Route]");
        addQ(qb, "ASP.NET", "Extension for Razor views?", ".razor", ".cshtml", ".html", ".aspx", ".cshtml");

        // Bulk Seed additional questions to allow large tests (50+ questions)
        String[] cats = {"JAVA", "PYTHON", "DBMS", "APTITUDE", "CLOUD", "ASP.NET"};
        for (String cat : cats) {
            for (int i = 1; i <= 20; i++) {
                addQ(qb, cat, "Question " + i + " for " + cat + " certification path. Identify the correct architectural pattern.", 
                    "Pattern A", "Pattern B", "Pattern C", "Pattern D", "Pattern A");
            }
        }

        questionRepository.saveAll(qb);
        System.out.println("[SEEDER] SEEDED QUESTIONS: " + qb.size());
    }

    private void hardenDatabase() {
        System.out.println("[HARDENING] Applying attempt integrity constraints...");
        try {
            // 1. Drop the problematic full unique index if it exists
            // This was blocking practice tests because it only allowed one SUBMITTED record per test.
            jdbcTemplate.execute("DROP INDEX IF EXISTS IDX_USER_TEST_STATUS");
            jdbcTemplate.execute("DROP INDEX IF EXISTS IDX_ONE_IN_PROGRESS_PER_TEST");

            // 2. Wipe ALL legacy attempts to clear out buggy 0% results and start fresh
            // System.out.println("[CLEANUP] Wiping all legacy attempt data...");
            // jdbcTemplate.update("DELETE FROM ATTEMPT_ANSWERS");
            // jdbcTemplate.update("DELETE FROM TEST_ATTEMPTS");

            // 3. Create a PARTIAL UNIQUE INDEX (The correct way)
            // Only ONE record can be 'IN_PROGRESS' for a (user, test) pair.
            // Multiple 'SUBMITTED' records are allowed (required for Practice Tests).
            try {
                jdbcTemplate.execute(
                    "CREATE UNIQUE INDEX IDX_ONE_IN_PROGRESS_PER_USER_TEST " +
                    "ON TEST_ATTEMPTS (USER_ID, TEST_ID) " +
                    "WHERE STATUS = 'IN_PROGRESS'"
                );
                System.out.println("[HARDENING] Partial unique index enforced: One IN_PROGRESS attempt per (user, test).");
            } catch (Exception e) {
                System.err.println("[HARDENING] Partial index creation failed: " + e.getMessage());
                // Fallback: If partial index is not supported by this H2 version, we rely on AttemptService logic.
            }

        } catch (Exception e) {
            System.err.println("[HARDENING] Critical Error during database hardening: " + e.getMessage());
        }
    }

    private void addQ(List<Question> list, String cat, String text, String a, String b, String c, String d, String correct) {
        Question q = new Question();
        q.setCategory(cat);
        q.setQuestionText(text);
        q.setOptionA(a);
        q.setOptionB(b);
        q.setOptionC(c);
        q.setOptionD(d);
        q.setCorrectAnswer(correct);
        list.add(q);
    }
}
