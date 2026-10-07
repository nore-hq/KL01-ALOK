ALTER TABLE attendance RENAME COLUMN overtime_hours TO overtime_pay;
ALTER TABLE attendance ADD COLUMN timestamp text;
