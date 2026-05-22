# Trellisform database

```bash
# Start container:
docker run --name postgresql-testdb -p 5432:5432 -d -e POSTGRES_USER=root -e POSTGRES_PASSWORD=mypass postgres
# read -p 'POSTGRES_USER: ' POSTGRES_USER; read -p 'POSTGRES_PASSWORD: ' POSTGRES_PASSWORD; docker run --name postgresql-testdb -p 5432:5432 -d postgres

# Recreate db:
db_name=main; echo "DROP DATABASE IF EXISTS $db_name; CREATE DATABASE $db_name;" | docker exec -i postgresql-testdb psql
# for compose it's `... | docker compose exec -T compose_image_name psql`

# Run interactive shell
docker run -it --link postgresql-testdb:postgres --rm devpies/pgcli

# or run the file
cat db.sql | docker exec -i postgresql-testdb psql -d $db_name
cat db.sql | docker compose exec -T database psql -d $db_name

# Remove container
docker rm -f postgresql-testdb
```

## DB TODO

1. answer scoring and permanent mark logging
2. ability for educational space admins to override automatic marking results
3. Ability for education space admins to rename students to names only they see
4. Provide rest api for bulk rename of students by their emails and maybe other
   SSO integration with DonSTU
5. A way to distinguish between manually marked by teacher correct answers and
   automatically marked
6. ability to have proper constraints and distinguishing of
   single-proper-answer questions and few-proper-answers questions
7. ability to assign a variant either to a group, or to a user
8. ability for user to start session test
9. ability to not only set static marks, but also leave comments to answers
10. ability to leave feedback on generated tests, questions and answers
11. ability to group tests by topics and subjects. (Subjects can have topics in
    them)
12. ability to preserve difficulty of a test
13. ability to add tests and variants to favorites
14. ability to mark answers as "correct"
15. ability to copy layout from other test
16. audit log table
17. mechanism to protect from redeclaring the columns
18. add granted by permissions column
19. refactor some data-types to small integers
20. ability to create anonymous answers (for surveys)?
21. ability to fixate answer scores either manually or at the end of launched testing
22. ability to set custom durations per group, to accommodate disabled people
23. ability to organize tests -- create courses?

## General TODO
