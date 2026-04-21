import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://mvtgtndxgfwlutrffbcz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dGd0bmR4Z2Z3bHV0cmZmYmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTgyNzMsImV4cCI6MjA5MjIzNDI3M30.CDJhnlDSULmepL7HTymfFs0mLDSBCcIZA7WFJhK9-7E'
)