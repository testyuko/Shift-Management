-- Step 1: データベースのセキュリティ更新
-- 既存の公開アクセスポリシーを削除し、認証済みユーザーのみアクセス可能にします

-- employeesテーブルのポリシー更新
DROP POLICY IF EXISTS "Anyone can view employees" ON employees;
DROP POLICY IF EXISTS "Anyone can insert employees" ON employees;
DROP POLICY IF EXISTS "Anyone can update employees" ON employees;
DROP POLICY IF EXISTS "Anyone can delete employees" ON employees;

CREATE POLICY "Authenticated users can view employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (true);

-- shiftsテーブルのポリシー更新
DROP POLICY IF EXISTS "Anyone can view shifts" ON shifts;
DROP POLICY IF EXISTS "Anyone can insert shifts" ON shifts;
DROP POLICY IF EXISTS "Anyone can update shifts" ON shifts;
DROP POLICY IF EXISTS "Anyone can delete shifts" ON shifts;

CREATE POLICY "Authenticated users can view shifts"
  ON shifts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert shifts"
  ON shifts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update shifts"
  ON shifts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete shifts"
  ON shifts FOR DELETE
  TO authenticated
  USING (true);

-- notesテーブルのポリシー更新
DROP POLICY IF EXISTS "Anyone can view notes" ON notes;
DROP POLICY IF EXISTS "Anyone can insert notes" ON notes;
DROP POLICY IF EXISTS "Anyone can update notes" ON notes;
DROP POLICY IF EXISTS "Anyone can delete notes" ON notes;

CREATE POLICY "Authenticated users can view notes"
  ON notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete notes"
  ON notes FOR DELETE
  TO authenticated
  USING (true);