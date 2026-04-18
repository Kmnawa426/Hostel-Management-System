For hst number

1️⃣ Create a sequence

This keeps track of the next number.

CREATE SEQUENCE hst_number_seq START 1;
2️⃣ Create a trigger function

This generates the formatted value.

CREATE OR REPLACE FUNCTION generate_hst_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hst_number IS NULL OR NEW.hst_number = '' THEN
    NEW.hst_number :=
      'HST' || LPAD(nextval('hst_number_seq')::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

This converts numbers into:

1 → HST001
2 → HST002
3 → HST003
3️⃣ Attach trigger to students table
CREATE TRIGGER hst_number_trigger
BEFORE INSERT ON students
FOR EACH ROW
EXECUTE FUNCTION generate_hst_number();
4️⃣ Now your CSV can stay like this
name,class,father_name,father_phone,mother_name,mother_phone,student_phone
Chaitra Hegde,1st PUC,Mahesh Hegde,7935324550,Rekha Hegde,7280516137,7125686787

And Supabase will insert:

HST001
HST002
HST003

automatically.

5️⃣ Important (Fix existing rows)

If your table already has rows, sync the sequence:

SELECT setval('hst_number_seq', (SELECT COUNT(*) FROM students));
Result
hst_number	name
HST001	Rahul Gowda
HST002	Sneha Shetty
HST003	Chaitra Hegde