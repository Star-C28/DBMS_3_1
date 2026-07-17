-- Section A

-- 1. Missing Data
SELECT name
FROM student
WHERE ID NOT IN (SELECT ID FROM takes);

-- 2. Credit Check
SELECT SUM(credits) AS total_credits
FROM course
WHERE dept_name = 'Comp. Sci.';

-- 3. The Budget Cut
UPDATE department
SET budget = budget * 0.95;
-- Section B

DELIMITER //

CREATE PROCEDURE get_dept_instructors(IN p_dept_name VARCHAR(20))
BEGIN
    SELECT ID, name
    FROM instructor
    WHERE dept_name = p_dept_name;
END //

CREATE PROCEDURE register_student(
    IN p_student_id VARCHAR(5),
    IN p_course_id VARCHAR(8),
    IN p_sec_id VARCHAR(8),
    IN p_semester VARCHAR(6),
    IN p_year NUMERIC(4,0)
)
BEGIN
    INSERT INTO takes (ID, course_id, sec_id, semester, year, grade)
    VALUES (p_student_id, p_course_id, p_sec_id, p_semester, p_year, NULL);
END //

DELIMITER ;

-- Test
CALL register_student('00128', 'CS-101', '1', 'Fall', 2024);
-- Section C

DELIMITER //

CREATE TRIGGER check_salary
BEFORE INSERT ON instructor
FOR EACH ROW
BEGIN
    IF NEW.salary > 150000 THEN
        SET NEW.salary = 150000;
    END IF;
END //

CREATE TRIGGER update_tot_cred
AFTER UPDATE ON takes
FOR EACH ROW
BEGIN
    IF OLD.grade IS NULL AND NEW.grade IN ('A', 'B', 'C') THEN
        UPDATE student
        SET tot_cred = tot_cred + (
            SELECT credits
            FROM course
            WHERE course.course_id = NEW.course_id
        )
        WHERE student.ID = NEW.ID;
    END IF;
END //

DELIMITER ;
