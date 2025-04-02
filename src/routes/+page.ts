import type { PageLoad } from "./$types";

export const load: PageLoad = ({ url }) => {
    const prolificID = url.searchParams.get('PROLIFIC_PID') || '';
  
    const conditionMap: Record<string, string> = {
      '1': 'conditionOne',
      '2': 'conditionTwo',
      '3': 'conditionThree'
    };
  
    const condition = conditionMap[url.searchParams.get('c') || ''] || '';
    console.log('URL params:', prolificID, condition);
    return { prolificID, condition };

  };

