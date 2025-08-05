/**
 * Utility for loading shader files
 */

/**
 * Load a text file from the public directory
 * @param {string} path - Path relative to the public directory
 * @returns {Promise<string>} - The file contents as a string
 */
export async function loadTextFile(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load file: ${path} (${response.status})`);
    }
    return await response.text();
  } catch (error) {
    throw new Error(`Error loading file ${path}: ${error.message}`);
  }
}

/**
 * Load shader files and return their sources
 * @param {string} vertexPath - Path to vertex shader file
 * @param {string} fragmentPath - Path to fragment shader file
 * @returns {Promise<{vertexSource: string, fragmentSource: string}>}
 */
export async function loadShaderFiles(vertexPath, fragmentPath) {
  try {
    const [vertexSource, fragmentSource] = await Promise.all([
      loadTextFile(vertexPath),
      loadTextFile(fragmentPath)
    ]);
    
    return {
      vertexSource,
      fragmentSource
    };
  } catch (error) {
    throw new Error(`Failed to load shader files: ${error.message}`);
  }
}

/**
 * Load the default particle shaders
 * @returns {Promise<{vertexSource: string, fragmentSource: string}>}
 */
export async function loadParticleShaders() {
  const basePath = import.meta.env.BASE_URL;
  const normalizedBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
  return loadShaderFiles(
    `${normalizedBasePath}shaders/particle.vert`, 
    `${normalizedBasePath}shaders/particle.frag`
  );
}
