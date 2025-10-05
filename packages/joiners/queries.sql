-- drop table a;
-- drop table b;
create table a(id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, v int);
create table b(id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, v int);
-- truncate a;
-- truncate b;
insert into a(v) values (6), (6), (7), (7), (9);
insert into b(v) values (7), (7), (8), (8), (10);

select a.id as "a.id", b.id as "b.id", a.v as "a.v", b.v as "b.v" from a left  outer join b using (v);
select a.id as "a.id", b.id as "b.id", a.v as "a.v", b.v as "b.v" from a right outer join b using (v);
select a.id as "a.id", b.id as "b.id", a.v as "a.v", b.v as "b.v" from a full  outer join b using (v);
select a.id as "a.id", b.id as "b.id", a.v as "a.v", b.v as "b.v" from a inner       join b using (v);
select a.id as "a.id", b.id as "b.id", a.v as "a.v", b.v as "b.v" from a cross       join b;
select a.id as "a.id", b.id as "b.id", a.v as "a.v", b.v as "b.v" from a left  outer join b using (v) where b.v is null;
select a.id as "a.id", b.id as "b.id", a.v as "a.v", b.v as "b.v" from a right outer join b using (v) where a.v is null;
select a.id as "a.id", b.id as "b.id", a.v as "a.v", b.v as "b.v" from a full  outer join b using (v) where a.v is null or b.v is null;
