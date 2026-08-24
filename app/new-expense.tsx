import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { DatePickerInput } from '@/components/ui/date-picker-input';
import { TextInput } from '@/components/ui/text-input';
import { useAuth } from '@/context/auth-context';
import { useBranch } from '@/context/branch-context';
import { useToast } from '@/context/toast-context';
import { ExpenseCategoryPicker } from '@/features/expenses/components/expense-category-picker';
import { useExpenseCategories } from '@/features/expenses/hooks/use-expense-categories';
import { createExpense } from '@/lib/api';

function toIso(date: Date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export default function NewExpenseScreen() {
  const { token } = useAuth();
  const { selectedBranch } = useBranch();
  const { categories } = useExpenseCategories({ token });
  const { showToast } = useToast();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCategoryId = categoryId ?? categories.find((c) => c.is_active)?.id ?? null;

  async function handleSubmit() {
    if (!description.trim()) { setError('Description is required.'); return; }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      setError('Enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const result = await createExpense(token!, {
      description: description.trim(),
      amount: parseFloat(amount),
      expense_date: toIso(expenseDate),
      note: note.trim() || null,
      branch_id: selectedBranch?.id,
      expense_category_id: activeCategoryId ?? undefined,
    });
    setIsSubmitting(false);
    if (result.ok) {
      showToast('Expense created');
      router.back();
    } else {
      setError(result.error.message);
    }
  }

  return (
    <ScrollView className="flex-1 bg-page dark:bg-page-dark">
      <View className="gap-4 p-4">
        <TextInput
          label="Description *"
          placeholder="e.g. Detergent supplies"
          value={description}
          onChangeText={setDescription}
          autoCapitalize="sentences"
          autoCorrect={false}
        />
        <TextInput
          label="Amount *"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        <DatePickerInput
          label="Date *"
          value={expenseDate}
          onChange={setExpenseDate}
        />
        <ExpenseCategoryPicker
          categories={categories}
          selectedCategoryId={activeCategoryId}
          onSelect={setCategoryId}
        />
        <TextInput
          label="Note"
          placeholder="Optional note"
          value={note}
          onChangeText={setNote}
          autoCapitalize="sentences"
          autoCorrect={false}
        />

        {error ? <Text className="text-sm text-red-500 dark:text-red-400">{error}</Text> : null}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`w-full items-center rounded-xl bg-primary py-3.5${isSubmitting ? ' opacity-50' : ''}`}
          activeOpacity={0.8}
        >
          <Text className="text-sm font-semibold text-white">
            {isSubmitting ? 'Creating...' : 'Create Expense'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
