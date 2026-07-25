
-- after v2 body, only fails
SELECT section||'|'||check_name||'|'||actual AS fail_row
FROM _matrix_results WHERE NOT pass;
