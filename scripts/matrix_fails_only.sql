-- Re-run matrix; emit ONLY fails + summary (single result set friendly)
\i is not supported — paste body from access_matrix_pentest then:

SELECT section, check_name, expected, actual,
       CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END AS verdict
FROM _matrix_results
WHERE pass = false
ORDER BY section, check_name;
