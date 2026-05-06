import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { updateForm } from './interactionSlice';

const API = 'http://localhost:8000/api';

// Detect if message is about logging a new interaction
const isLoggingMessage = (msg) => {
  const lower = msg.toLowerCase();
  const logKeywords = ['met ', 'visited ', 'called ', 'meeting with', 'spoke with', 'discussed with'];
  return logKeywords.some(k => lower.includes(k));
};

export const sendChatMessage = createAsyncThunk(
  'chat/send',
  async ({ message, history }, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post(`${API}/agent/chat`, { message, history });
      const { response, extracted_data } = res.data;

      // Only auto-fill form if this was a logging message AND we got extracted data
      if (extracted_data && isLoggingMessage(message)) {
        const today = new Date().toISOString().split('T')[0];
        const now   = new Date().toTimeString().slice(0, 5);
        dispatch(updateForm({
          hcp_name:            extracted_data.hcp_name            || '',
          interaction_type:    extracted_data.interaction_type    || 'Meeting',
          date:                extracted_data.date                || today,
          time:                extracted_data.time                || now,
          attendees:           extracted_data.attendees           || '',
          topics_discussed:    extracted_data.topics_discussed    || '',
          materials_shared:    Array.isArray(extracted_data.materials_shared)    ? extracted_data.materials_shared    : [],
          samples_distributed: Array.isArray(extracted_data.samples_distributed) ? extracted_data.samples_distributed : [],
          sentiment:           extracted_data.sentiment           || 'Neutral',
          outcomes:            extracted_data.outcomes            || '',
          follow_up_actions:   extracted_data.follow_up_actions   || '',
        }));
        return { response, formFilled: true };
      }

      return { response, formFilled: false };
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Error connecting to AI');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [{
      role: 'assistant',
      content:
        '👋 Hi! I can help you:\nTry: _"Met Dr. Patel at AIIMS, discussed Product X, positive sentiment, shared brochure"_',
    }],
    loading:    false,
    formFilled: false,
    error:      null,
  },
  reducers: {
    addUserMessage: (state, action) => {
      state.messages.push({ role: 'user', content: action.payload });
      state.formFilled = false;
    },
    clearChat: (state) => {
      state.messages = [{
        role: 'assistant',
        content: 'Chat cleared. How can I help you? Describe an HCP interaction or ask me anything.',
      }];
      state.formFilled = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading   = false;
        state.formFilled = action.payload.formFilled;
        state.messages.push({
          role:    'assistant',
          content: action.payload.response,
        });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
        state.messages.push({
          role:    'assistant',
          content: '❌ Error: ' + (action.payload || 'Could not reach the AI. Make sure backend is running.'),
        });
      });
  },
});

export const { addUserMessage, clearChat } = chatSlice.actions;
export default chatSlice.reducer;
