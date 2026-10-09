import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A note title is required.'],
      trim: true,
      maxlength: [120, 'Titles must be 120 characters or fewer.'],
    },
    content: {
      type: String,
      default: '',
      maxlength: [20000, 'Notes must be 20,000 characters or fewer.'],
    },
    color: {
      type: String,
      enum: ['butter', 'mint', 'rose', 'sky', 'lilac', 'paper'],
      default: 'butter',
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model('Note', noteSchema);
