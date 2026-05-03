// AI Chat Service - Connects to Raju's backend API
// Configure the API URL in .env file as VITE_AI_API_URL

const API_URL =
  import.meta.env.VITE_AI_API_URL ||
  "https://hd04vwiu3c.execute-api.us-east-1.amazonaws.com/prod/chat";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  message: string;
  success: boolean;
  error?: string;
}

/**
 * Send a message to Raju's AI backend and get a response
 */
export async function sendMessage(
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  try {
    // Build history array expected by the backend and send current message separately
    const history = conversationHistory.map((msg) => ({ role: msg.role, content: msg.content }));

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // The API returns { headers: {...}, body: "{\"response\": \"...\"}" }
    // The body is a JSON string that needs to be parsed
    let messageContent = "";

    if (data.body) {
      // Parse the body JSON string
      const bodyData = JSON.parse(data.body);
      messageContent =
        bodyData.response || bodyData.message || bodyData.answer || "";
    } else {
      // Fallback for direct response format
      messageContent = data.response || data.message || data.answer || "";
    }

    return {
      message: messageContent,
      success: true,
    };
  } catch (error) {
    console.error("AI Chat API Error:", error);

    // Return a fallback response when API is unavailable
    return {
      message: getFallbackResponse(message),
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Fallback responses when the API is unavailable
 */
function getFallbackResponse(question: string): string {
  const lowerQuestion = question.toLowerCase();

  // Experience questions
  if (
    lowerQuestion.includes("experience") ||
    lowerQuestion.includes("years") ||
    lowerQuestion.includes("work")
  ) {
    return `I have 7+ years of experience as a Software Engineer, currently working as a Senior Software Engineer at AbbVie. My background spans Linux systems, embedded engineering, and open-source software. I've also worked at Rakuten and Bank of America.`;
  }

  // Skills questions
  if (
    lowerQuestion.includes("skill") ||
    lowerQuestion.includes("language") ||
    lowerQuestion.includes("tech")
  ) {
    return `My core skills include C/C++, Python, Go, and Bash. I specialize in Linux systems, kernel-level optimization, Yocto/Debian build pipelines, and distributed systems. I'm also experienced with Docker, Kubernetes, and cloud platforms like AWS and OCI.`;
  }

  // Linux questions
  if (
    lowerQuestion.includes("linux") ||
    lowerQuestion.includes("kernel") ||
    lowerQuestion.includes("embedded")
  ) {
    return `Linux is my specialty! I have 7+ years working with Linux systems, including device drivers, bootloaders, kernel modules, and Yocto/Debian build pipelines. At AbbVie, I lead a Linux-based compute stack running 500+ analytics jobs weekly.`;
  }

  // AI/ML questions
  if (
    lowerQuestion.includes("ai") ||
    lowerQuestion.includes("machine learning") ||
    lowerQuestion.includes("ml")
  ) {
    return `I've worked on several AI/ML projects including an AI-Powered Data Analyst Agent using LLMs, CyberSenseAI for anomaly detection with TensorFlow, and a Capacity Planning Tool using PyTorch. I also write about AI on Medium!`;
  }

  // Education questions
  if (
    lowerQuestion.includes("education") ||
    lowerQuestion.includes("degree") ||
    lowerQuestion.includes("university")
  ) {
    return `I have a Master's in Computer Science from Wichita State University (2021-2022) and a Bachelor's in Computer Science & Engineering from Reva University, India (2016-2020).`;
  }

  // Contact questions
  if (
    lowerQuestion.includes("contact") ||
    lowerQuestion.includes("email") ||
    lowerQuestion.includes("hire")
  ) {
    return `You can reach me at rajuking9056@gmail.com or connect with me on LinkedIn at linkedin.com/in/raju-yallappa. I'm currently open to new opportunities!`;
  }

  // Projects questions
  if (
    lowerQuestion.includes("project") ||
    lowerQuestion.includes("portfolio") ||
    lowerQuestion.includes("built")
  ) {
    return `Some of my featured projects include: AI-Powered Data Analyst Agent, OpenNet Optimizer (distributed routing simulator), CyberSenseAI (anomaly detection), and a Capacity Planning Tool. Check out my GitHub at github.com/raju9056!`;
  }

  // Current role questions
  if (
    lowerQuestion.includes("current") ||
    lowerQuestion.includes("now") ||
    lowerQuestion.includes("abbvie")
  ) {
    return `I'm currently a Senior Software Engineer at AbbVie in San Francisco. I lead development of a Linux-based compute stack, build Yocto/Debian pipelines, and develop C++ and Python services for 1,000+ edge devices.`;
  }

  // Greeting
  if (
    lowerQuestion.includes("hello") ||
    lowerQuestion.includes("hi") ||
    lowerQuestion.includes("hey")
  ) {
    return `Hello! I'm Raju's AI assistant. I can tell you about his experience, skills, projects, and more. What would you like to know?`;
  }

  // Default response
  return `I'm Raju's personal assistant! I can answer questions about his experience, skills, projects, education, and more. The backend API seems to be unavailable right now, but feel free to ask me anything and I'll do my best to help!`;
}
