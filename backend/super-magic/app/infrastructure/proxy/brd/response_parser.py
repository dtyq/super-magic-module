from typing import Any, Dict

from requests import Response


class ResponseParser:
    """响应解析器"""

    def get_response_data(self, response: Response) -> Dict[str, Any]:
        """解析响应数据

        Args:
            response: HTTP响应对象

        Returns:
            Dict[str, Any]: 解析后的响应数据

        Raises:
            ValueError: 响应状态码不是2xx
        """
        if not 200 <= response.status_code < 300:
            raise ValueError(f"Request failed with status code: {response.status_code}")

        return response.json()
