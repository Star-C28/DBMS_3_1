-- Section A

-- 1. String Matching
SELECT name
FROM instructor
WHERE name LIKE '%an%';

-- 2. Null Values
SELECT ID, course_id
FROM takes
WHERE grade IS NULL;

-- 3. Department Census
SELECT dept_name, COUNT(*) AS instructor_count
FROM instructor
GROUP BY dept_name;

-- 4. Department Spending
SELECT dept_name, AVG(salary) AS avg_salary
FROM instructor
GROUP BY dept_name;

-- 5. High Budget Departments
SELECT dept_name
FROM instructor
GROUP BY dept_name
HAVING AVG(salary) > 70000;
-- Section B

-- 6. Semester Overlap
SELECT course_id
FROM section
WHERE semester = 'Fall' AND year = 2024
INTERSECT
SELECT course_id
FROM section
WHERE semester = 'Spring' AND year = 2025;

-- 7. Semester Exclusions
SELECT course_id
FROM section
WHERE semester = 'Fall' AND year = 2024
EXCEPT
SELECT course_id
FROM section
WHERE semester = 'Spring' AND year = 2025;

-- 8. The "CS" List
SELECT name
FROM instructor
UNION
SELECT name
FROM student;
-- Section C

-- 9. The "Average" Threshold
SELECT name
FROM instructor
WHERE salary > (
    SELECT AVG(salary)
    FROM instructor
);

-- 10. Course Comparison
SELECT name
FROM instructor
WHERE salary > SOME (
    SELECT salary
    FROM instructor
    WHERE dept_name = 'Biology'
);

-- If SOME is not supported, use ANY:
SELECT name
FROM instructor
WHERE salary > ANY (
    SELECT salary
    FROM instructor
    WHERE dept_name = 'Biology'
);

-- 11. Enrolled Students
SELECT name
FROM student
WHERE ID IN (
    SELECT ID
    FROM takes
    WHERE course_id = 'CS-101'
);
-- Section D
-- Run these last.

-- 12. New Hire
-- Your current department table does NOT include Music,
-- so add Music first:

INSERT INTO department
VALUES ('Music', 'Packard', 80000);

INSERT INTO instructor
VALUES ('99999', 'Mozart', 'Music', 50000);

-- 13. The Raise
UPDATE instructor
SET salary = salary * 1.05
WHERE dept_name = 'Comp. Sci.';

-- 14. Cleanup
DELETE 
FROM takes
WHERE ID IN(
SELECT ID
FROM student
WHERE tot_cred<40);

DELETE
FROM student
WHERE tot_cred<40