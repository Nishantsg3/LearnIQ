package learniq_backend;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class PurgeScript {
    public static void main(String[] args) {
        System.out.println("Starting purge...");
        try {
            Class.forName("org.h2.Driver");
            try (Connection conn = DriverManager.getConnection("jdbc:h2:file:./data/testdb;DB_CLOSE_DELAY=-1;AUTO_SERVER=TRUE", "sa", "")) {
                Statement stmt = conn.createStatement();
            
            String target = "Java Practice 2";
            
            System.out.println("Deleting attempt_answers...");
            int a1 = stmt.executeUpdate("DELETE FROM attempt_answers WHERE attempt_id IN (SELECT id FROM test_attempts WHERE test_id IN (SELECT id FROM test WHERE LOWER(title) = LOWER('" + target + "')))");
            System.out.println("Deleted " + a1 + " attempt_answers.");
            
            System.out.println("Deleting test_attempts...");
            int a2 = stmt.executeUpdate("DELETE FROM test_attempts WHERE test_id IN (SELECT id FROM test WHERE LOWER(title) = LOWER('" + target + "'))");
            System.out.println("Deleted " + a2 + " test_attempts.");
            
            System.out.println("Deleting test_questions...");
            int a3 = stmt.executeUpdate("DELETE FROM test_questions WHERE test_id IN (SELECT id FROM test WHERE LOWER(title) = LOWER('" + target + "'))");
            System.out.println("Deleted " + a3 + " test_questions.");
            
            System.out.println("Nullifying legacy test_id in question table...");
            int a3_5 = stmt.executeUpdate("UPDATE question SET test_id = NULL WHERE test_id IN (SELECT id FROM test WHERE LOWER(title) = LOWER('" + target + "'))");
            System.out.println("Nullified " + a3_5 + " questions.");
            
            System.out.println("Deleting test...");
            int a4 = stmt.executeUpdate("DELETE FROM test WHERE LOWER(title) = LOWER('" + target + "')");
            System.out.println("Deleted " + a4 + " test.");
            
            System.out.println("Purge complete.");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
