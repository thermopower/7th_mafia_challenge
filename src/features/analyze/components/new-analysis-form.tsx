/**
 * 새 분석 입력 폼 컴포넌트
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { analysisInputSchema, type AnalysisInput } from '@/features/analyze/lib/schema'
import { useCreateAnalysis } from '@/features/analyze/hooks/use-create-analysis'
import { AnalysisLoading } from './analysis-loading'

export function NewAnalysisForm() {
  const form = useForm<AnalysisInput>({
    resolver: zodResolver(analysisInputSchema),
    defaultValues: {
      name: '',
      gender: undefined,
      birthDate: '',
      birthTime: undefined,
      isLunar: false,
      analysisType: 'yearly',
      saveAsProfile: false,
    },
  })

  const { mutate: createAnalysis, isPending } = useCreateAnalysis()

  const onSubmit = (data: AnalysisInput) => {
    createAnalysis(data)
  }

  if (isPending) {
    return <AnalysisLoading />
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 이름 */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름</FormLabel>
              <FormControl>
                <Input placeholder="홍길동" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 성별 */}
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>성별</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <label htmlFor="male" className="cursor-pointer">
                      남성
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <label htmlFor="female" className="cursor-pointer">
                      여성
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 생년월일 */}
        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>생년월일</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 음력/양력 */}
        <FormField
          control={form.control}
          name="isLunar"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">음력</FormLabel>
                <div className="text-sm text-muted-foreground">생년월일을 음력으로 입력한 경우 체크하세요</div>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* 태어난 시간 */}
        <FormField
          control={form.control}
          name="birthTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>태어난 시간 (선택사항)</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <div className="text-sm text-muted-foreground">정확한 시간을 모르는 경우 비워두셔도 됩니다</div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 분석 종류 */}
        <FormField
          control={form.control}
          name="analysisType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>분석 종류</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="분석 종류를 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monthly">월간 운세</SelectItem>
                  <SelectItem value="yearly">신년 운세</SelectItem>
                  <SelectItem value="lifetime">평생 운세</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 프로필로 저장 */}
        <FormField
          control={form.control}
          name="saveAsProfile"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>프로필로 저장</FormLabel>
                <div className="text-sm text-muted-foreground">
                  이 정보를 프로필로 저장하여 다음에 쉽게 불러올 수 있습니다
                </div>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          분석 시작
        </Button>
      </form>
    </Form>
  )
}
