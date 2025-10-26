'use client';

import { useWallet } from '@/hooks/useWallet';
import { api } from '@/lib/api';
import { TaskType } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, Sparkles, Upload, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SubmitTaskPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isConnected } = useWallet();

  const taskId = params.taskId as string;
  const [formData, setFormData] = useState({
    text: '',
    imageFile: null as File | null,
    labels: '',
    answers: [] as string[],
    comment: '',
    decision: '',
    customFields: {} as Record<string, any>
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: taskData, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => api.tasks.getById(taskId),
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.submissions.submit(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });

      const submissionId = response.data.submissionId;
      router.push(`/submissions/${submissionId}`);
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Submission failed');
    },
  });

  const task = taskData?.data;
  const requiredFields: string[] = task?.verificationCriteria?.requiredFields || [];

  // Helper function to check if a field is required
  const isFieldRequired = (fieldName: string) => requiredFields.includes(fieldName);

  // Helper function to render survey questions
  const getSurveyQuestions = () => {
    // This could come from the task description or verification criteria
    // For now, we'll use some default questions based on task type
    if (task?.taskType === TaskType.SURVEY) {
      return [
        'How would you rate the overall user experience? (1-5)',
        'What features did you find most useful?',
        'What improvements would you suggest?'
      ];
    }
    // You could also get questions from task.verificationCriteria.questions if available
    return task?.verificationCriteria?.questions || [];
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, image: 'File size must be less than 5MB' });
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors({ ...errors, image: 'Only JPG, PNG, WebP images are allowed' });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setFormData({ ...formData, imageFile: file });
    setErrors({ ...errors, image: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    // Dynamic validation based on verification criteria
    const newErrors: Record<string, string> = {};

    requiredFields.forEach((field: string) => {
      switch (field) {
        case 'text':
          if (!formData.text.trim()) {
            newErrors.text = 'Text is required';
          }
          break;
        case 'image':
          if (!formData.imageFile) {
            newErrors.image = 'Image is required';
          }
          break;
        case 'labels':
          if (!formData.labels.trim()) {
            newErrors.labels = 'Labels are required';
          }
          break;
        case 'answers':
          if (!formData.answers || formData.answers.length === 0 || formData.answers.some(answer => !answer?.trim())) {
            newErrors.answers = 'All survey questions must be answered';
          }
          break;
        case 'comment':
          if (!formData.comment.trim()) {
            newErrors.comment = 'Comment is required';
          }
          break;
        case 'decision':
          if (!formData.decision) {
            newErrors.decision = 'Decision is required';
          }
          break;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare submission data dynamically
    const submissionData: any = {};

    requiredFields.forEach((field: string) => {
      switch (field) {
        case 'text':
          submissionData.text = formData.text;
          break;
        case 'image':
          // In production, upload to cloud storage (S3, Cloudinary, etc.)
          submissionData.imageUrls = ['https://placeholder.com/image.jpg'];
          submissionData.metadata = { fileName: formData.imageFile?.name };
          break;
        case 'labels':
          submissionData.labels = formData.labels.split(',').map(label => label.trim());
          break;
        case 'answers':
          submissionData.answers = formData.answers;
          break;
        case 'comment':
          submissionData.comment = formData.comment;
          break;
        case 'decision':
          submissionData.decision = formData.decision;
          break;
      }
    });

    // Submit
    await submitMutation.mutateAsync({
      taskId,
      submissionData,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-8 h-8 text-orange-500" />
        </motion.div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-96 h-96 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            style={{ top: "20%", left: "10%" }}
          />
        </div>
        <div className="relative z-10 text-center py-32">
          <h2 className="text-2xl font-bold text-foreground">Task not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          style={{ top: "10%", left: "-10%" }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-br from-orange-600/10 to-orange-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          style={{ bottom: "10%", right: "-10%" }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 pt-32">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Task
          </button>
        </motion.div>

        {/* Task Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 backdrop-blur-md rounded-3xl border border-orange-500/30 p-6 mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-2">{task.title}</h2>
              <p className="text-foreground/70 mb-3">{task.description}</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full font-bold">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-white rounded-full"
                />
                Payment: ${task.paymentAmount} cUSD
              </div>
            </div>
          </div>
        </motion.div>

        {/* Submission Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-background/80 backdrop-blur-md rounded-3xl border border-orange-500/20 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Submit Your Work</h3>
          </div>

          {/* Text Field - Dynamic based on required fields */}
          {isFieldRequired('text') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <label className="block text-sm font-semibold text-foreground mb-3">
                {task.taskType === TaskType.TEXT_VERIFICATION ? 'Your Response' :
                  task.taskType === TaskType.CONTENT_MODERATION ? 'Comment to Review' : 'Text'} *
              </label>
              <div className="relative">
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  rows={task.taskType === TaskType.TEXT_VERIFICATION ? 8 : 4}
                  placeholder={
                    task.taskType === TaskType.TEXT_VERIFICATION ? "Enter your response here..." :
                      task.taskType === TaskType.CONTENT_MODERATION ? "Paste the comment to review here..." :
                        "Enter your text here..."
                  }
                  className={`w-full px-4 py-3 bg-background/50 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.text ? 'border-red-500' : 'border-orange-500/30'
                    } text-foreground placeholder:text-foreground/40`}
                />
                {errors.text && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {errors.text}
                  </motion.p>
                )}
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-foreground/60">{formData.text.length} characters</span>
                  {formData.text.length > 0 && (
                    <span className="text-orange-500 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Looking good!
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Comment Field (for content moderation when text is not required) */}
          {isFieldRequired('comment') && !isFieldRequired('text') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <label className="block text-sm font-semibold text-foreground mb-3">
                Comment to Review *
              </label>
              <div className="relative">
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  rows={4}
                  placeholder="Paste the comment to review here..."
                  className={`w-full px-4 py-3 bg-background/50 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.comment ? 'border-red-500' : 'border-orange-500/30'
                    } text-foreground placeholder:text-foreground/40`}
                />
                {errors.comment && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {errors.comment}
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}

          {/* Decision Field (for content moderation) */}
          {isFieldRequired('decision') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-6"
            >
              <label className="block text-sm font-semibold text-foreground mb-3">
                Moderation Decision *
              </label>
              <div className="relative">
                <select
                  value={formData.decision}
                  onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                  className={`w-full px-4 py-3 bg-background/50 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.decision ? 'border-red-500' : 'border-orange-500/30'
                    } text-foreground`}
                >
                  <option value="">Select a decision...</option>
                  <option value="approved">✅ Approve - Content is appropriate</option>
                  <option value="rejected">❌ Reject - Content violates rules</option>
                  <option value="flagged">🚩 Flag for Review - Needs human review</option>
                </select>
                {errors.decision && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {errors.decision}
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}

          {/* Labels Field (for image labeling) */}
          {isFieldRequired('labels') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <label className="block text-sm font-semibold text-foreground mb-3">
                Image Labels *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.labels}
                  onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
                  placeholder="Enter labels separated by commas (e.g., car, tree, building)"
                  className={`w-full px-4 py-3 bg-background/50 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.labels ? 'border-red-500' : 'border-orange-500/30'
                    } text-foreground placeholder:text-foreground/40`}
                />
                {errors.labels && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {errors.labels}
                  </motion.p>
                )}
                <p className="mt-2 text-sm text-foreground/60">
                  Separate multiple labels with commas
                </p>
              </div>
            </motion.div>
          )}

          {/* Survey Answers Field */}
          {isFieldRequired('answers') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mb-6"
            >
              <label className="block text-sm font-semibold text-foreground mb-4">
                Survey Questions *
              </label>
              <div className="space-y-4">
                {getSurveyQuestions().map((question: string, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="bg-gradient-to-br from-orange-500/5 to-orange-600/5 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-4"
                  >
                    <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      {question}
                    </p>
                    <textarea
                      value={formData.answers[index] || ''}
                      onChange={(e) => {
                        const newAnswers = [...formData.answers];
                        newAnswers[index] = e.target.value;
                        setFormData({ ...formData, answers: newAnswers });
                      }}
                      rows={3}
                      placeholder="Enter your answer here..."
                      className="w-full px-4 py-3 bg-background/50 border border-orange-500/20 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-foreground placeholder:text-foreground/40"
                    />
                  </motion.div>
                ))}
              </div>
              {errors.answers && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-sm text-red-500 flex items-center gap-1"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {errors.answers}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Image Labeling */}
          {task.taskType === TaskType.IMAGE_LABELING && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <label className="block text-sm font-semibold text-foreground mb-3">
                Upload Image *
              </label>
              <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${errors.image ? 'border-red-500' : 'border-orange-500/30 hover:border-orange-500/50'
                }`}>
                {imagePreview ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-96 mx-auto rounded-xl shadow-lg"
                    />
                    <motion.button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({ ...formData, imageFile: null });
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                    <div className="mt-4 text-sm text-foreground/60">
                      {formData.imageFile?.name}
                    </div>
                  </motion.div>
                ) : (
                  <div>
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-2xl mb-4"
                    >
                      <Upload className="w-10 h-10 text-orange-500" />
                    </motion.div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-lg shadow-orange-500/25"
                      >
                        Choose Image
                      </motion.div>
                    </label>
                    <p className="mt-3 text-sm text-foreground/60">PNG, JPG, WebP up to 5MB</p>
                  </div>
                )}
              </div>
              {errors.image && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-500 flex items-center gap-1"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {errors.image}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Task-specific Instructions */}
          {(isFieldRequired('text') && isFieldRequired('image')) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-2xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium mb-1">📋 Mixed Task Instructions</p>
                  <p className="text-sm text-foreground/70">
                    This task requires both text and image inputs. Please provide both components to complete your submission.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Additional Context for Complex Tasks */}
          {task?.verificationCriteria?.aiPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52 }}
              className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-2xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium mb-1">🎯 Verification Criteria</p>
                  <p className="text-sm text-foreground/70">
                    AI will verify your submission based on: {task.verificationCriteria.aiPrompt}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Required Fields Summary */}
          {requiredFields.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.54 }}
              className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-2xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground font-medium mb-2">✅ Required Fields</p>
                  <div className="flex flex-wrap gap-2">
                    {requiredFields.map((field: string) => (
                      <motion.span
                        key={field}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.56 + requiredFields.indexOf(field) * 0.05 }}
                        className="px-3 py-1 bg-green-500/20 text-green-700 dark:text-green-300 text-xs rounded-full font-medium border border-green-500/30"
                      >
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Warning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-foreground font-medium mb-1">AI Verification</p>
                <p className="text-sm text-foreground/70">
                  Your submission will be automatically verified by Gemini AI. Please ensure it meets all requirements to avoid rejection.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={submitMutation.isPending || !isConnected}
            whileHover={submitMutation.isPending || !isConnected ? {} : { scale: 1.02 }}
            whileTap={submitMutation.isPending || !isConnected ? {} : { scale: 0.98 }}
            className="w-full py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-lg shadow-lg shadow-orange-500/25 disabled:shadow-none"
          >
            {submitMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                Submitting...
              </span>
            ) : !isConnected ? (
              'Connect Wallet to Submit'
            ) : (
              <span className="flex items-center justify-center gap-2">
                Submit Task
                <CheckCircle2 className="w-5 h-5" />
              </span>
            )}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
}