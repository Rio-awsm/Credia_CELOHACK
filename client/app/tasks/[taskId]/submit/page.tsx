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
  const [formData, setFormData] = useState({ text: '', imageFile: null as File | null });
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

    // Validation
    const newErrors: Record<string, string> = {};

    if (task?.taskType === TaskType.TEXT_VERIFICATION && !formData.text.trim()) {
      newErrors.text = 'Text is required';
    }

    if (task?.taskType === TaskType.IMAGE_LABELING && !formData.imageFile) {
      newErrors.image = 'Image is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare submission data
    const submissionData: any = {};

    if (task?.taskType === TaskType.TEXT_VERIFICATION) {
      submissionData.text = formData.text;
    }

    if (task?.taskType === TaskType.IMAGE_LABELING) {
      // In production, upload to cloud storage (S3, Cloudinary, etc.)
      submissionData.imageUrls = ['https://placeholder.com/image.jpg'];
      submissionData.metadata = { fileName: formData.imageFile?.name };
    }

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

          {/* Text Verification */}
          {task.taskType === TaskType.TEXT_VERIFICATION && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <label className="block text-sm font-semibold text-foreground mb-3">
                Your Response *
              </label>
              <div className="relative">
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  rows={8}
                  placeholder="Enter your response here..."
                  className={`w-full px-4 py-3 bg-background/50 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.text ? 'border-red-500' : 'border-orange-500/30'
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
              <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                errors.image ? 'border-red-500' : 'border-orange-500/30 hover:border-orange-500/50'
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

          {/* Warning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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