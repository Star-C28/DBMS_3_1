-- Section A

-- 1. Faculty Roster
SELECT name, dept_name
FROM instructor;

-- 2. High Earners
SELECT name
FROM instructor
WHERE salary > 70000;

-- 3. Department Filtering
SELECT name, tot_cred
FROM student
WHERE dept_name = 'Comp. Sci.';

-- 4. Course Catalog
SELECT title, credits
FROM course
WHERE credits = 3;


-- Section B

-- 5. Specific Faculty Criteria
SELECT name, salary
FROM instructor
WHERE dept_name = 'Finance'
  AND salary > 80000;

-- 6. Excluded Departments
SELECT name
FROM instructor
WHERE dept_name <> 'Comp. Sci.';

-- 7. Department Budgets
SELECT instructor.name, instructor.dept_name, department.budget
FROM instructor, department
WHERE instructor.dept_name = department.dept_name;

-- 8. Student Advisors
SELECT s_ID
FROM advisor
WHERE i_ID = '10101';


-- Section C

-- 9. Who takes what?
SELECT student.name, takes.course_id
FROM student, takes
WHERE student.ID = takes.ID;

-- 10. The "Taylor" Building Schedule
SELECT instructor.name
FROM instructor, teaches, section
WHERE instructor.ID = teaches.ID
  AND teaches.course_id = section.course_id
  AND teaches.sec_id = section.sec_id
  AND teaches.semester = section.semester
  AND teaches.year = section.year
  AND section.building = 'Taylor';

-- 11. Prerequisite Chains
SELECT c.title AS course_title, p.title AS prerequisite_title
FROM course AS c, prereq, course AS p
WHERE c.course_id = prereq.course_id
  AND p.course_id = prereq.prereq_id;

-- 12. The "Einstein" Salary Challenge
SELECT i.name
FROM instructor AS i, instructor AS e
WHERE e.name = 'Einstein'
  AND i.salary > e.salary;