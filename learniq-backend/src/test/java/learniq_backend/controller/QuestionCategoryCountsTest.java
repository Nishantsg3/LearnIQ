package learniq_backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:question_category_counts_test;DB_CLOSE_DELAY=-1",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.jwt.secret=test-only-jwt-secret-not-for-production-minimum-32-chars-long"
})
public class QuestionCategoryCountsTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Category counts endpoint returns case-insensitive non-zero counts for all 6 disciplines")
    @WithMockUser(username = "admin@learniq.com", roles = {"ADMIN"})
    void categoryCountsShouldReturnCaseInsensitiveCountsForAllDisciplines() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/questions/category-counts"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());

        assertNotNull(json);
        assertTrue(json.has("JAVA"), "Must contain JAVA count");
        assertTrue(json.has("PYTHON"), "Must contain PYTHON count");
        assertTrue(json.has("APTITUDE"), "Must contain APTITUDE count");
        assertTrue(json.has("ASP.NET"), "Must contain ASP.NET count");
        assertTrue(json.has("DBMS"), "Must contain DBMS count");
        assertTrue(json.has("CLOUD"), "Must contain CLOUD count");
        assertTrue(json.has("TOTAL"), "Must contain TOTAL count");

        assertEquals(50, json.get("JAVA").asLong(), "JAVA count must be 50");
        assertEquals(50, json.get("PYTHON").asLong(), "PYTHON count must be 50");
        assertEquals(50, json.get("APTITUDE").asLong(), "APTITUDE count must be 50");
        assertEquals(50, json.get("ASP.NET").asLong(), "ASP.NET count must be 50");
        assertEquals(50, json.get("DBMS").asLong(), "DBMS count must be 50");
        assertEquals(50, json.get("CLOUD").asLong(), "CLOUD count must be 50");
        assertEquals(300, json.get("TOTAL").asLong(), "TOTAL count must be 300");
    }

    @Test
    @DisplayName("Bank filtered endpoint returns questions case-insensitively for Java vs JAVA")
    @WithMockUser(username = "admin@learniq.com", roles = {"ADMIN"})
    void bankFilteredShouldMatchCaseInsensitively() throws Exception {
        MvcResult upperResult = mockMvc.perform(get("/api/v1/questions/bank-filtered?category=JAVA"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode upperJson = objectMapper.readTree(upperResult.getResponse().getContentAsString());
        assertTrue(upperJson.isArray());
        assertEquals(50, upperJson.size(), "Upper case category query must return 50 questions");

        MvcResult mixedResult = mockMvc.perform(get("/api/v1/questions/bank-filtered?category=Java"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode mixedJson = objectMapper.readTree(mixedResult.getResponse().getContentAsString());
        assertTrue(mixedJson.isArray());
        assertEquals(50, mixedJson.size(), "Mixed case category query must return 50 questions");
    }
}
